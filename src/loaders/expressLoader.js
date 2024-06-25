import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import api from '../routes';

const setupMiddleware = (app) => {
  // Sử dụng middleware để phân tích JSON từ các yêu cầu
  app.use(express.json());

  // Sử dụng middleware để phân tích các body được mã hóa từ URL
  app.use(express.urlencoded({ extended: true }));

  // Sử dụng CORS middleware
  app.use(cors());

  // Sử dụng bodyParser để phân tích các body từ yêu cầu HTTP
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  // Sử dụng routes từ module routes đã import
  app.use(api);
};

export default setupMiddleware;
