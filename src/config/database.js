import Sequelize from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const { DB_USERNAME, DB_PASSWORD, DB_DATABASE, DB_HOST, DB_PORT } = process.env;

const sequelize = new Sequelize(DB_DATABASE, DB_USERNAME, DB_PASSWORD, {
  host: DB_HOST,
  port: DB_PORT,
  dialect: 'mysql',
  timezone: '+07:00', // Thiết lập múi giờ tại đây
});
export default sequelize;

// config để kết nối tới db, nếu sử dụng file config thì kh cần file này
