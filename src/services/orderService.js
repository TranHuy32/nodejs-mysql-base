import db from '../models';
import ApiError from '../helpers/ApiError';
import { StatusCodes } from 'http-status-codes';
import { OrderStatus, PayStatus } from '../models/order';
import { UserRole } from '../common/constants';
import { Op } from 'sequelize';
import teleBotService from './teleBotService';


const { Order, OrderItem, Product, User, School, StaffAssignment } = db;

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
      teleBotService.sendMessage(order.toJSON());
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
        where.created_at = { ...where.created_at, [Op.gte]: start }; // Filter by start date if provided
      }

      if (endDate) {
        const end = new Date(parseInt(endDate, 10));
        end.setHours(23, 59, 59, 999); // Set to the end of the day
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

      if (schoolId) {
        where.school_id = schoolId;
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
        return { products: [] };
      }

      const staffAssignment = await StaffAssignment.findAll({
        attributes: ['id', 'product_id', 'staff_id', 'assign_date'], // Changed 'select' to 'attributes'
        where: {
          assign_date: {
            [Op.gte]: targetDate,
            [Op.lte]: endOfDay,
          }
        },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'name'],
          },
        ],
      });
      const staffAssignmentMap = staffAssignment.map(assignment => {
        return {
          product_id: assignment.product_id,
          user: assignment.user
        };
      }).reduce((acc, { product_id, user }) => {
        if (!acc[product_id]) {
          acc[product_id] = [];
        }
        acc[product_id] = (!!user ? user.toJSON() : null);
        return acc;
      }, {});

      const productStats = {};

      orders.forEach((order) => {
        order.orderItems.forEach((orderItem) => {
          const product = orderItem.product;
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

      return { products: Object.values(productStats) };
    } catch (error) {
      console.error('error', error);
      throw new ApiError(
        error.message,
        error.status || StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
export default new OrderService();
