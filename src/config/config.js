const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

const { DB_USERNAME, DB_PASSWORD, DB_DATABASE, DB_HOST } = process.env;

const config = {
  development: {
    username: DB_USERNAME,
    password: DB_PASSWORD,
    database: DB_DATABASE,
    host: DB_HOST,
    dialect: 'mysql',
  },
};

module.exports = config;
