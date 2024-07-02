const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

const { DB_USERNAME, DB_PASSWORD, DB_DATABASE, DB_HOST, DB_PORT } = process.env;

const config = {
  development: {
    username: DB_USERNAME,
    password: DB_PASSWORD,
    database: DB_DATABASE,
    host: DB_HOST,
    port: DB_PORT,
    dialect: 'mysql',
  },
};

module.exports = config;
