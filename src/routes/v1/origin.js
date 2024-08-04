import { Router } from 'express';
import OriginService from '../../services/originService';
import { successHandler } from '../../helpers/responseHandler';
import { verifyAccessToken } from '../../middlewares/verifyToken';
import { UserRole } from '../../common/constants';

const route = Router();

const setupRoutes = (app) => {
  app.use('/origin', route);

  route.post(
    '',
    verifyAccessToken([UserRole.ADMIN]),
    async (req, res, next) => {
      try {
        const result = await OriginService.create(req);
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
        const result = await OriginService.getAll(req);
        return successHandler(res, 'success', result);
      } catch (err) {
        return next(err);
      }
    },
  );
};

export default setupRoutes;
