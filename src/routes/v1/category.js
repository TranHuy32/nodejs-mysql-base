import { Router } from 'express';
import CategoryService from '../../services/categoryService';
import { successHandler } from '../../helpers/responseHandler';
import { verifyAccessToken } from '../../middlewares/verifyToken';
import { UserRole } from '../../common/constants';

const route = Router();

const setupRoutes = (app) => {
  app.use('/category', route);

  route.post(
    '',
    verifyAccessToken([UserRole.ADMIN]),
    async (req, res, next) => {
      try {
        const result = await CategoryService.create(req);
        return successHandler(res, 'success', result);
      } catch (err) {
        return next(err);
      }
    },
  );

  route.get(
    '',
    verifyAccessToken([UserRole.ADMIN]),
    async (req, res, next) => {
      try {
        const result = await CategoryService.getAll(req);
        return successHandler(res, 'success', result);
      } catch (err) {
        return next(err);
      }
    },
  );
};

export default setupRoutes;
