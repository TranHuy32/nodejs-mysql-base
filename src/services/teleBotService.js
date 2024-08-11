import ApiError from '../helpers/ApiError';
import axios from 'axios';
import db from '../models';

const Order = db.Order;
const OrderItem = db.OrderItem;
const Product = db.Product;
const User = db.User;
const School = db.School;

class TeleBotService {
  async sendMessage(order) {
    const { TELE_BOT_TOKEN, TELE_CHAT_ID } = process.env;
    try {
      const existOrder = await Order.findOne({
        where: { id: order.id },
        attributes: ['id', 'total_amount'], // Select specific attributes for Order
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
            attributes: ['name'],
          },
          {
            model: School,
            as: 'school',
            attributes: ['name'],
          },
        ],
      });

      const orderJson = existOrder ? existOrder.toJSON() : null;
      if (
        !orderJson ||
        !orderJson.orderItems ||
        orderJson.orderItems.length === 0
      ) {
        return;
      }

      const formattedOrder = `
THỰC ĐƠN MỚI
Lúc: ${new Date().toLocaleString('vi-VN')}
Trường học: ${orderJson.school.name || 'Chưa xác định'}
Tổng: ${+orderJson.total_amount} VND
========================

SẢN PHẨM:
${orderJson.orderItems
  .map(
    (item) => `- ${item.product.name} (${item.quantity} ${item.product.unit})
................................`,
  )
  .join('\n')}`;

      const response = await axios.post(
        `https://api.telegram.org/bot${TELE_BOT_TOKEN}/sendMessage`,
        {
          chat_id: TELE_CHAT_ID,
          text: formattedOrder,
        },
      );
      return response.data;
    } catch (error) {
      console.error('error', error);
      throw new ApiError(error.message, error.status);
    }
  }
}

export default new TeleBotService();
