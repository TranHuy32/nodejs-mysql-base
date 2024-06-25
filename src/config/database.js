import Sequelize from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const { DB_USERNAME, DB_PASSWORD, DB_DATABASE, DB_HOST } = process.env;

const sequelize = new Sequelize(DB_DATABASE, DB_USERNAME, DB_PASSWORD, {
  host: DB_HOST,
  dialect: 'mysql',
});
export default sequelize;
