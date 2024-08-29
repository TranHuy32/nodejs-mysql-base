import { Router } from 'express';
import OrderService from '../../services/orderService';
import { successHandler } from '../../helpers/responseHandler';
import { verifyAccessToken } from '../../middlewares/verifyToken';
import { UserRole } from '../../common/constants';

const route = Router();

const setupRoutes = (app) => {
  app.use('/order', route);

  route.post('', verifyAccessToken([UserRole.USER]), async (req, res, next) => {
    try {
      const result = await OrderService.create(req);
      return successHandler(res, 'success', result);
    } catch (err) {
      return next(err);
    }
  });

  route.get(
    '',
    verifyAccessToken([UserRole.ADMIN, UserRole.USER, UserRole.STAFF]),
    async (req, res, next) => {
      try {
        const result = await OrderService.getAll(req);
        return successHandler(res, 'success', result);
      } catch (err) {
        return next(err);
      }
    },
  );

  route.get(
    '/debt',
    verifyAccessToken([UserRole.ADMIN, UserRole.USER, UserRole.STAFF]),
    async (req, res, next) => {
      try {
        const result = await OrderService.getDebt(req);
        return successHandler(res, 'success', result);
      } catch (err) {
        return next(err);
      }
    },
  );

  route.get(
    '/buy',
    verifyAccessToken([UserRole.ADMIN, UserRole.STAFF]),
    async (req, res, next) => {
      try {
        const result = await OrderService.allProductsNeedToBuy(req);
        return successHandler(res, 'success', result);
      } catch (err) {
        return next(err);
      }
    },
  );

  route.get(
    '/revenue',
    verifyAccessToken([UserRole.ADMIN, UserRole.STAFF]),
    async (req, res, next) => {
      try {
        const result = await OrderService.revenue(req);
        return successHandler(res, 'success', result);
      } catch (err) {
        return next(err);
      }
    },
  );

  route.get(
    '/statistical',
    verifyAccessToken([UserRole.ADMIN, UserRole.STAFF]),
    async (req, res, next) => {
      try {
        const result = await OrderService.statistical(req);
        return successHandler(res, 'success', result);
      } catch (err) {
        return next(err);
      }
    },
  );

  route.patch(
    '/pay/:id',
    verifyAccessToken([UserRole.ADMIN, UserRole.STAFF]),
    async (req, res, next) => {
      try {
        const result = await OrderService.pay(req);
        return successHandler(res, 'success', result);
      } catch (err) {
        return next(err);
      }
    },
  );
};

export default setupRoutes;
