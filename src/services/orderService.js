import db from '../models';
import ApiError from '../helpers/ApiError';
import { StatusCodes } from 'http-status-codes';
import { OrderStatus, PayStatus } from '../models/order';
import { UserRole } from '../common/constants';
import { Op, or } from 'sequelize';
import teleBotService from './teleBotService';
const {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
} = require('docx');
const fs = require('fs');
const path = require('path');
const mammoth = require('mammoth');
const libre = require('libreoffice-convert');

const { Order, OrderItem, Product, User, School, StaffAssignment, UserSchool } =
  db;

class OrderService {
  async create(req) {
    const transaction = await db.sequelize.transaction();
    try {
      const { totalAmount, products } = req.body;
      const { id, school_id } = req.user;

      // Validate order data
      if (!products || products.length === 0) {
        throw new ApiError('Order items are required', StatusCodes.BAD_REQUEST);
      }

      // Create a new order record within the transaction
      const order = await Order.create(
        {
          user_id: id,
          total_amount: totalAmount,
          status: OrderStatus.PENDING,
          school_id: school_id,
        },
        { transaction },
      );

      // Create order items within the transaction
      const orderItems = await Promise.all(
        products.map(async (product) => {
          const existedProduct = await Product.findByPk(product.productId);

          if (!existedProduct) {
            throw new ApiError('Product not found', StatusCodes.BAD_REQUEST);
          }
          return {
            order_id: order.id,
            product_id: product.productId,
            quantity: product.quantity,
            price: existedProduct.price,
          };
        }),
      );

      await OrderItem.bulkCreate(orderItems, { transaction });

      // Commit the transaction
      await transaction.commit();
      await teleBotService.sendMessage(order.toJSON());
      return order;
    } catch (error) {
      // Rollback the transaction in case of an error
      await transaction.rollback();
      console.error('error', error);
      throw new ApiError(
        error.message,
        error.status || StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }
  async getAll(req) {
    console.log('[all order]', req.query);
    try {
      const { role, school_id } = req.user;
      const {
        pageSize = 20,
        page = 1,
        status,
        schoolId,
        payStatus,
        startDate,
        endDate,
      } = req.query; // Default limit to 20 and page to 1 if not provided
      const limit = parseInt(pageSize, 10);
      const currentPage = parseInt(page, 10);
      const offset = (currentPage - 1) * limit;

      // Build the where clause based on the filters
      const where = {};
      if (status) {
        where.status = status; // Filter by order status if provided
      }

      if (payStatus) {
        where.pay_status = payStatus; // Filter by order status if provided
      }
      if (startDate) {
        const start = new Date(parseInt(startDate, 10));
        start.setHours(0, 0, 0, 0); // Set to the beginning of the day
        console.log('start', start);
        where.created_at = { ...where.created_at, [Op.gte]: start }; // Filter by start date if provided
      }

      if (endDate) {
        const end = new Date(parseInt(endDate, 10));
        end.setHours(23, 59, 59, 999); // Set to the end of the day
        console.log('end', end);
        where.created_at = { ...where.created_at, [Op.lte]: end }; // Filter by end date if provided
      }
      // Restrict orders to the current user if not an admin
      if (role === UserRole.USER) {
        where.school_id = school_id;
      } else {
        if (!!schoolId) {
          where.school_id = schoolId;
        }
      }

      const { count, rows: orders } = await Order.findAndCountAll({
        where: where,
        distinct: true,
        limit: limit,
        offset: offset,
        attributes: [
          'id',
          'user_id',
          'total_amount',
          'status',
          'pay_status',
          'created_at',
        ], // Select specific attributes for Order
        include: [
          {
            model: OrderItem,
            as: 'orderItems',
            attributes: ['quantity', 'price'],
            include: [
              {
                model: Product,
                as: 'product',
                attributes: ['id', 'name', 'unit'],
              },
            ],
          },
          {
            model: User,
            as: 'user',
            attributes: ['id', 'name'],
          },
          {
            model: School,
            as: 'school',
            attributes: ['id', 'name'],
          },
        ],
        order: [['created_at', 'DESC']],
      });

      const totalPages = Math.ceil(count / limit);

      return {
        docs: orders || [],
        paging: {
          totalItems: count,
          totalPages: totalPages,
          currentPage: currentPage,
          pageSize: limit,
        },
      };
    } catch (error) {
      console.error('error', error);
      throw new ApiError(
        error.message,
        error.status || StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getDebt(req) {
    console.log('[debt]', req.query);
    try {
      const { role, school_id } = req.user;
      const { startDate, endDate, schoolId } = req.query;

      // Build the where clause based on the filters
      const where = {
        pay_status: PayStatus.PENDING,
      };

      if (startDate) {
        const start = new Date(parseInt(startDate, 10));
        start.setHours(0, 0, 0, 0); // Set to the beginning of the day
        where.created_at = { ...where.created_at, [Op.gte]: start };
      }

      if (endDate) {
        const end = new Date(parseInt(endDate, 10));
        end.setHours(23, 59, 59, 999); // Set to the end of the day
        where.created_at = { ...where.created_at, [Op.lte]: end };
      }

      // Restrict orders to the current user's school_id if not an admin
      if (role === UserRole.USER) {
        where.school_id = school_id;
      } else {
        if (schoolId) {
          where.school_id = schoolId;
        }
      }

      const orders = await Order.findAll({
        attributes: ['total_amount'],
        where,
      });

      if (orders.length === 0) {
        return { debt: 0 };
      }

      const totalDebt = orders.reduce(
        (sum, order) => sum + +order.total_amount,
        0,
      );

      return { debt: totalDebt };
    } catch (error) {
      console.error('error', error);
      throw new ApiError(
        error.message,
        error.status || StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async allProductsNeedToBuy(req) {
    console.log('[all product need to buy]', req.query);
    try {
      const { date, schoolId, status } = req.query;
      const where = {};

      if (!!status) {
        where.status = status;
      }

      // Set date to today's date if not provided
      const targetDate = date ? new Date(parseInt(date, 10)) : new Date();
      targetDate.setHours(0, 0, 0, 0); // Set to the beginning of the day
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999); // Set to the end of the day
      where.created_at = {
        [Op.gte]: targetDate,
        [Op.lte]: endOfDay,
      };
      let user = null;
      if (!!schoolId) {
        where.school_id = schoolId;
        console.log(1111111111, userSchool);

        const userSchool = await UserSchool.findOne({
          where: {
            school_id: schoolId,
          },
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'name'],
            },
          ],
        });
        console.log(1111111111, userSchool);

        user = !!userSchool ? userSchool.user : null;
      }

      const orders = await Order.findAll({
        where,
        include: [
          {
            model: OrderItem,
            as: 'orderItems',
            attributes: ['quantity'],
            include: [
              {
                model: Product,
                as: 'product',
                attributes: ['id', 'name', 'unit'],
              },
            ],
          },
        ],
      });

      if (orders.length === 0) {
        return { products: [], userAssigned: user };
      }

      const staffAssignment = await StaffAssignment.findAll({
        attributes: ['id', 'product_id', 'staff_id', 'assign_date'], // Changed 'select' to 'attributes'
        where: {
          assign_date: {
            [Op.gte]: targetDate,
            [Op.lte]: endOfDay,
          },
        },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'name'],
          },
        ],
      });
      const staffAssignmentMap = staffAssignment
        .map((assignment) => {
          return {
            product_id: assignment.product_id,
            user: assignment.user,
          };
        })
        .reduce((acc, { product_id, user }) => {
          if (!acc[product_id]) {
            acc[product_id] = [];
          }
          acc[product_id] = !!user ? user.toJSON() : null;
          return acc;
        }, {});

      const productStats = {};

      orders.forEach((order) => {
        order.orderItems.forEach((orderItem) => {
          const product = orderItem.product;
          if (!product) {
            return;
          }
          if (!productStats[product.id]) {
            productStats[product.id] = {
              id: product.id,
              name: product.name,
              quantity: 0,
              unit: product.unit,
              staff: staffAssignmentMap[product.id] || null, // Ensure staff is assigned correctly
            };
          }
          productStats[product.id].quantity += +orderItem.quantity;
        });
      });

      return { products: Object.values(productStats), userAssigned: user };
    } catch (error) {
      console.error('error', error);
      throw new ApiError(
        error.message,
        error.status || StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async revenue(req) {
    try {
      let { year } = req.query;

      if (!year) {
        year = new Date().getFullYear();
      }

      const revenues = [];
      const monthNames = [
        'Tháng 1',
        'Tháng 2',
        'Tháng 3',
        'Tháng 4',
        'Tháng 5',
        'Tháng 6',
        'Tháng 7',
        'Tháng 8',
        'Tháng 9',
        'Tháng 10',
        'Tháng 11',
        'Tháng 12',
      ];

      for (let month = 0; month < 12; month++) {
        const start = new Date(year, month, 1);
        const end = new Date(year, month + 1, 0, 23, 59, 59, 999);

        const where = {
          pay_status: PayStatus.COMPLETED,
          created_at: {
            [Op.gte]: start,
            [Op.lte]: end,
          },
        };

        const orders = await Order.findAll({
          attributes: ['total_amount'],
          where,
        });

        const totalRevenue = orders.reduce(
          (sum, order) => sum + +order.total_amount,
          0,
        );

        revenues.push({
          month: monthNames[month],
          revenue: totalRevenue,
        });
      }

      return { revenues };
    } catch (error) {
      console.error('error', error);
      throw new ApiError(
        error.message,
        error.status || StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async statistical(req) {
    try {
      let { startDate, endDate } = req.query;

      // Set default values to today's date if not provided
      const today = new Date();
      if (!startDate) {
        startDate = today.getTime().toString();
      }
      if (!endDate) {
        endDate = today.getTime().toString();
      }

      // Convert startDate and endDate to the start and end of the day
      const startOfDay = new Date(parseInt(startDate, 10));
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(parseInt(endDate, 10));
      endOfDay.setHours(23, 59, 59, 999);

      const where = {
        created_at: {
          [Op.gte]: startOfDay,
          [Op.lte]: endOfDay,
        },
        pay_status: PayStatus.COMPLETED,
      };

      const orders = await Order.findAll({
        where,
        include: [
          {
            model: OrderItem,
            as: 'orderItems',
            include: [
              {
                model: Product,
                as: 'product',
                attributes: ['id', 'name', 'price'],
              },
            ],
          },
        ],
      });

      const productMap = new Map();

      orders.forEach((order) => {
        order.orderItems.forEach((item) => {
          if (
            item &&
            item.product &&
            item.quantity != null &&
            item.product.price != null
          ) {
            const productId = item.product.id;
            if (!productMap.has(productId)) {
              productMap.set(productId, {
                id: productId,
                name: item.product.name,
                price: item.product.price,
                totalQuantity: 0,
                totalPrice: 0,
              });
            }
            const product = productMap.get(productId);
            product.totalQuantity += +item.quantity;
            product.totalPrice += +item.quantity * +item.product.price;
          }
        });
      });

      const products = Array.from(productMap.values());

      return { products };
    } catch (error) {
      console.error('error', error);
      throw new ApiError(
        error.message,
        error.status || StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async pay(req) {
    const { id } = req.params;
    console.log('id', id);

    const order = await Order.findByPk(id, {
      include: [
        {
          model: OrderItem,
          as: 'orderItems',
          include: [{ model: Product, as: 'product' }],
        },
        {
          model: User,
          as: 'user',
          include: [{ model: School, as: 'school' }],
        },
      ],
    });
    if (!order) {
      throw new ApiError('Order not found', StatusCodes.NOT_FOUND);
    }
    // if (order.pay_status === PayStatus.COMPLETED) {
    //   throw new ApiError('Order is already paid', StatusCodes.BAD_REQUEST);
    // }
    order.pay_status = PayStatus.COMPLETED;
    order.status = OrderStatus.COMPLETED;
    try {
      await order.save();
      const filePath = await createWordDocument(order);
      await teleBotService.sendFile(filePath);
      return order;
    } catch (error) {
      console.error('error', error);
      throw new ApiError(
        error.message,
        error.status || StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }

    async function createWordDocument(order) {
      try {
        // Initialize the Document with A4 page size in portrait orientation
        const doc = new Document({
          sections: [
            {
              properties: {
                page: {
                  size: {
                    width: 11906, // A4 width in TWIPs for portrait
                    height: 16838, // A4 height in TWIPs for portrait
                  },
                },
              },
              children: [
                // Title/Header
                new Paragraph({
                  children: [
                    new TextRun({
                      text: 'CỬA HÀNG HOÀNG THỊ QUỲNH',
                      size: 26,
                    }),
                  ],
                  alignment: 'center',
                }),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: 'Địa chỉ: chợ Bảo Nhai, xã Bảo Nhai, huyện Bắc Hà, tỉnh Lào Cai',
                      size: 24,
                    }),
                  ],
                  alignment: 'center',
                }),
                new Paragraph('\n'),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: 'PHIẾU GIAO HÀNG',
                      bold: true,
                      size: 34,
                    }),
                  ],
                  alignment: 'center',
                }),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `(Lập lúc: ${new Date().toLocaleString()})`,
                      size: 22,
                    }),
                  ],
                  alignment: 'center',
                }),
                new Paragraph('\n'),

                // Customer and Order Information
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `Khách hàng: ${order?.user?.name ? order.user.name : ''}`,
                      size: 24,
                    }),
                  ],
                  alignment: 'left',
                }),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `Trường: ${order?.user?.school?.name ? order.user.school.name : ''}`,
                      size: 24,
                    }),
                  ],
                  alignment: 'left',
                }),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `Mã đơn hàng: ${order.id}`,
                      size: 24,
                    }),
                  ],
                  alignment: 'left',
                }),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `Ngày giao: ${new Date().toLocaleDateString()}`,
                      size: 24,
                    }),
                  ],
                  alignment: 'left',
                }),
                new Paragraph('\n'),

                // Table headers with fixed column widths
                new Table({
                  alignment: 'center', // Center align the table
                  rows: [
                    // Header Row with explicit column widths
                    new TableRow({
                      height: { value: 500, rule: 'exact' }, // Set the row height
                      children: [
                        new TableCell({
                          width: { size: 700, type: 'DXA' },
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({ text: 'Stt', size: 24 }),
                              ],
                              alignment: 'center',
                            }),
                          ],
                          verticalAlign: 'center', // Center align text vertically
                        }),
                        new TableCell({
                          width: { size: 3000, type: 'DXA' },
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({ text: 'Sản phẩm', size: 24 }),
                              ],
                              alignment: 'center',
                            }),
                          ],
                          verticalAlign: 'center', // Center align text vertically
                        }),
                        new TableCell({
                          width: { size: 700, type: 'DXA' },
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({ text: 'Dvt', size: 24 }),
                              ],
                              alignment: 'center',
                            }),
                          ],
                          verticalAlign: 'center', // Center align text vertically
                        }),
                        new TableCell({
                          width: { size: 700, type: 'DXA' },
                          children: [
                            new Paragraph({
                              children: [new TextRun({ text: 'Sl', size: 24 })],
                              alignment: 'center',
                            }),
                          ],
                          verticalAlign: 'center', // Center align text vertically
                        }),
                        new TableCell({
                          width: { size: 1200, type: 'DXA' },
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({ text: 'Đơn giá', size: 24 }),
                              ],
                              alignment: 'center',
                            }),
                          ],
                          verticalAlign: 'center', // Center align text vertically
                        }),
                        new TableCell({
                          width: { size: 1200, type: 'DXA' },
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({ text: 'Thành tiền', size: 24 }),
                              ],
                              alignment: 'center',
                            }),
                          ],
                          verticalAlign: 'center', // Center align text vertically
                        }),
                        new TableCell({
                          width: { size: 1200, type: 'DXA' },
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({ text: 'Xác nhận', size: 24 }),
                              ],
                              alignment: 'center',
                            }),
                          ],
                          verticalAlign: 'center', // Center align text vertically
                        }),
                      ],
                    }),
                    // 7 Default Rows
                    ...Array.from({ length: 7 }).map((_, index) => {
                      const item = order.orderItems[index];
                      return new TableRow({
                        height: { value: 400, rule: 'exact' }, // Set the row height
                        children: [
                          new TableCell({
                            width: { size: 700, type: 'DXA' },
                            children: [
                              new Paragraph({
                                children: [
                                  new TextRun({
                                    text: (index + 1).toString(),
                                    size: 24,
                                  }),
                                ],
                                alignment: 'center',
                              }),
                            ],
                            verticalAlign: 'center', // Center align text vertically
                          }),
                          new TableCell({
                            width: { size: 3000, type: 'DXA' },
                            children: [
                              new Paragraph({
                                children: [
                                  new TextRun({
                                    text: item ? item.product.name : '',
                                    size: 24,
                                  }),
                                ],
                                alignment: 'center',
                              }),
                            ],
                            verticalAlign: 'center', // Center align text vertically
                          }),
                          new TableCell({
                            width: { size: 700, type: 'DXA' },
                            children: [
                              new Paragraph({
                                children: [
                                  new TextRun({
                                    text: item ? 'kg' : '',
                                    size: 24,
                                  }),
                                ],
                                alignment: 'center',
                              }),
                            ],
                            verticalAlign: 'center', // Center align text vertically
                          }),
                          new TableCell({
                            width: { size: 700, type: 'DXA' },
                            children: [
                              new Paragraph({
                                children: [
                                  new TextRun({
                                    text: item ? item.quantity.toString() : '',
                                    size: 24,
                                  }),
                                ],
                                alignment: 'center',
                              }),
                            ],
                            verticalAlign: 'center', // Center align text vertically
                          }),
                          new TableCell({
                            width: { size: 1200, type: 'DXA' },
                            children: [
                              new Paragraph({
                                children: [
                                  new TextRun({
                                    text: item
                                      ? item.price.toString()
                                      : '',
                                    size: 24,
                                  }),
                                ],
                                alignment: 'center',
                              }),
                            ],
                            verticalAlign: 'center', // Center align text vertically
                          }),
                          new TableCell({
                            width: { size: 1200, type: 'DXA' },
                            children: [
                              new Paragraph({
                                children: [
                                  new TextRun({
                                    text: item
                                      ? (
                                          item.quantity * item.price
                                        ).toString()
                                      : '',
                                    size: 24,
                                  }),
                                ],
                                alignment: 'center',
                              }),
                            ],
                            verticalAlign: 'center', // Center align text vertically
                          }),
                          new TableCell({
                            width: { size: 1200, type: 'DXA' },
                            children: [
                              new Paragraph({
                                children: [new TextRun({ text: '', size: 24 })],
                                alignment: 'center',
                              }),
                            ],
                            verticalAlign: 'center', // Center align text vertically
                          }),
                        ],
                      });
                    }),

                    // Total Row
                    new TableRow({
                      height: { value: 400, rule: 'exact' }, // Set the row height
                      children: [
                        new TableCell({
                          width: { size: 700, type: 'DXA' },
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({ text: 'Tổng:', size: 24 }),
                              ],
                              alignment: 'center',
                            }),
                          ],
                          columnSpan: 5,
                          verticalAlign: 'center', // Center align text vertically
                        }),
                        new TableCell({
                          width: { size: 1200, type: 'DXA' },
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({
                                  text:
                                    order.orderItems
                                      .reduce(
                                        (sum, item) =>
                                          sum + item.quantity * item.price,
                                        0,
                                      )
                                      .toString(),
                                  size: 24,
                                }),
                              ],
                              alignment: 'center',
                            }),
                          ],
                          verticalAlign: 'center', // Center align text vertically
                        }),
                        new TableCell({
                          width: { size: 1200, type: 'DXA' },
                          children: [
                            new Paragraph({
                              children: [new TextRun({ text: '', size: 24 })],
                              alignment: 'center',
                            }),
                          ],
                          verticalAlign: 'center', // Center align text vertically
                        }),
                      ],
                    }),
                  ],
                }),

                // Date and Signature Section
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `.................., ngày ..... tháng ..... năm ${new Date().getFullYear()}`,
                      italics: true,
                      size: 24,
                    }),
                  ],
                  alignment: 'right',
                  spacing: { before: 400, after: 400 },
                }),
                new Paragraph({
                  children: [
                    new TextRun({ text: 'Bên nhận hàng   ', size: 24 }),
                    new TextRun({ text: ' '.repeat(40), size: 24 }),
                    new TextRun({ text: '   Bên giao hàng', size: 24 }),
                  ],
                  alignment: 'center',
                }),
                new Paragraph({
                  children: [
                    new TextRun({ text: '(Ký, ghi rõ họ tên)', size: 24 }),
                    new TextRun({ text: ' '.repeat(40), size: 24 }),
                    new TextRun({ text: '(Ký, ghi rõ họ tên)', size: 24 }),
                  ],
                  alignment: 'center',
                }),
              ],
            },
          ],
        });

        // Generate a random file name
        const randomString = Math.random().toString(36).substring(2, 10);
        const schoolName = order?.user?.school?.name;
        const pdfName = schoolName.replaceAll(' ', '_') || randomString;
        const now = new Date();

        const day = now.getDate();
        const month = now.getMonth() + 1; // Months are zero-based, so add 1
        const year = now.getFullYear();
        const pdfDate = `${day}${month}${year}`;
        console.log(`Ngày: ${day}, Tháng: ${month}, Năm: ${year}`);
        const wordFilePath = path.join(
          __dirname,
          'orders',
          `Hóa_đơn_${pdfName}_${pdfDate}.docx`,
        );

        // Save the document to a file
        const buffer = await Packer.toBuffer(doc);
        fs.writeFileSync(wordFilePath, buffer);

        // Convert the Word document to PDF
        // const pdfFilePath = wordFilePath.replace('.docx', '.pdf');
        // await convertDocxToPdf(wordFilePath, pdfFilePath);
        return wordFilePath;
      } catch (error) {
        console.error('Document creation error:', error);
        throw new ApiError(
          'Error creating Word document',
          StatusCodes.INTERNAL_SERVER_ERROR,
        );
      }
    }

    async function convertDocxToPdf(wordFilePath, pdfFilePath) {
      // Đọc tệp .docx
      const file = fs.readFileSync(wordFilePath);
      console.log(1111111111, file);

      // Định dạng đích là PDF
      const outputFormat = '.pdf';

      // Thực hiện chuyển đổi
      await libre.convert(file, outputFormat, undefined, (err, done) => {
        if (err) {
          console.error(`Error converting file: ${err}`);
          return;
        }

        // Ghi file PDF đã chuyển đổi
        fs.writeFileSync(pdfFilePath, done);
        console.log('Conversion successful! PDF saved at:', pdfFilePath);
      });
    }
  }
}
export default new OrderService();
