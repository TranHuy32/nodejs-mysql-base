import db from '../models';
import ApiError from '../helpers/ApiError';
import { StatusCodes } from 'http-status-codes';
import { OrderStatus } from '../models/order';
import { UserRole } from '../common/constants';

const Order = db.Order;
const OrderItem = db.OrderItem;
const Product = db.Product;
const User = db.User;
const School = db.School;

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
            const order = await Order.create({
                user_id: id,
                total_amount: totalAmount,
                status: OrderStatus.PENDING,
                school_id: school_id
            }, { transaction });

            // Create order items within the transaction
            const orderItems = await Promise.all(products.map(async (product) => {

                const existedProduct = await Product.findByPk(product.productId);

                if (!existedProduct) {
                    throw new ApiError('Product not found', StatusCodes.BAD_REQUEST);
                }
                return {
                    order_id: order.id,
                    product_id: product.productId,
                    quantity: product.quantity,
                    price: existedProduct.price,
                }
            }))

            await OrderItem.bulkCreate(orderItems, { transaction });

            // Commit the transaction
            await transaction.commit();

            return order;
        } catch (error) {
            // Rollback the transaction in case of an error
            await transaction.rollback();
            console.error('error', error);
            throw new ApiError(error.message, error.status || StatusCodes.INTERNAL_SERVER_ERROR);
        }
    }
    async getAll(req) {
        try {
            const { role, school_id } = req.user;
            const { pageSize = 20, page = 1, status, schoolId } = req.query; // Default limit to 20 and page to 1 if not provided
            const limit = parseInt(pageSize, 10);
            const currentPage = parseInt(page, 10);
            const offset = (currentPage - 1) * limit;

            // Build the where clause based on the filters
            const where = {};
            if (status) {
                where.status = status; // Filter by order status if provided
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
                attributes: ['id', 'user_id', 'total_amount', 'status', 'created_at'], // Select specific attributes for Order
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
            throw new ApiError(error.message, error.status || StatusCodes.INTERNAL_SERVER_ERROR);
        }
    }
}
export default new OrderService();