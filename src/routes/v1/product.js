import { Router } from 'express';
import ProductService from '../../services/productService';
import { successHandler } from '../../helpers/responseHandler';
import { verifyAccessToken } from '../../middlewares/verifyToken';
import { UserRole } from '../../common/constants';
import upload from '../../middlewares/upload';

const route = Router();

const setupRoutes = (app) => {
  app.use('/product', route);

  route.post(
    '',
    verifyAccessToken([UserRole.ADMIN]),
    upload, // Use the array upload configuration
    async (req, res, next) => {
      try {
        if (req.files && req.files.length > 0) {
          req.file = req.files[0]; // Pick the first file
        } 
        console.log('req.file', req.file);
        console.log('req.body', req.body);
        const result = await ProductService.create(req);
        return successHandler(res, 'success', result);
      } catch (err) {
        return next(err);
      }
    },
  );

  route.get(
    '',
    verifyAccessToken([UserRole.ADMIN, UserRole.USER, UserRole.STAFF]),
    async (req, res, next) => {
      try {
        const result = await ProductService.getAll(req);
        return successHandler(res, 'success', result);
      } catch (err) {
        return next(err);
      }
    },
  );

  route.delete(
    '',
    verifyAccessToken([UserRole.ADMIN]),
    async (req, res, next) => {
      try {
        const result = await ProductService.deleteProduct(req);
        return successHandler(res, 'success', result);
      } catch (err) {
        return next(err);
      }
    },
  );
};

export default setupRoutes;
