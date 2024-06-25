'use strict';
import express from 'express';
import 'dotenv/config';
import sequelize from './config/database.js';
import loaders from './loaders';
const app = express();
const port = process.env.PORT || 4000;

async function connectDataBase() {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
    await loaders(app);
    app.listen(port, () => {
      console.log(`program is running on the http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
}
connectDataBase();
