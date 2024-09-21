import { Router } from 'express';
import UserService from '../../services/userService';
import { successHandler } from '../../helpers/responseHandler';
import { verifyAccessToken } from '../../middlewares/verifyToken';
import { UserRole } from '../../common/constants';

const route = Router();

const setupRoutes = (app) => {
  app.use('/user', route);

  route.get(
    '/',
    verifyAccessToken([UserRole.ADMIN]),
    async (req, res, next) => {
      try {
        const result = await UserService.getAll(req);
        return successHandler(res, 'success', result);
      } catch (err) {
        return next(err);
      }
    },
  );

  route.get(
    '/detail',
    verifyAccessToken([UserRole.ADMIN, UserRole.STAFF, UserRole.USER]),
    async (req, res, next) => {
      try {
        const result = await UserService.getDetail(req);
        return successHandler(res, 'success', result);
      } catch (err) {
        return next(err);
      }
    },
  );

  route.patch(
    '',
    verifyAccessToken([UserRole.ADMIN, UserRole.STAFF, UserRole.USER]),
    async (req, res, next) => {
      try {
        const result = await UserService.updateUser(req);
        return successHandler(res, 'success', result);
      } catch (err) {
        return next(err);
      }
    },
  );

  route.delete(
    '/:id',
    verifyAccessToken([UserRole.ADMIN]),
    async (req, res, next) => {
      try {
        const result = await UserService.delete(req);
        return successHandler(res, 'success', result);
      } catch (err) {
        return next(err);
      }
    },
  );

  route.post(
    '/assign',
    verifyAccessToken([UserRole.ADMIN]),
    async (req, res, next) => {
      try {
        const result = await UserService.assign(req);
        return successHandler(res, 'success', result);
      } catch (err) {
        return next(err);
      }
    },
  );
};

export default setupRoutes;
