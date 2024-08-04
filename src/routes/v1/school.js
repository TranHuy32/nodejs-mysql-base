import { Router } from 'express';
import SchoolService from '../../services/schoolService';
import { successHandler } from '../../helpers/responseHandler';
import { verifyAccessToken } from '../../middlewares/verifyToken';
import { UserRole } from '../../common/constants';

const route = Router();

const setupRoutes = (app) => {
  app.use('/school', route);

  route.post(
    '',
    verifyAccessToken([UserRole.ADMIN]),
    async (req, res, next) => {
      try {
        const result = await SchoolService.create(req);
        return successHandler(res, 'success', result);
      } catch (err) {
        return next(err);
      }
    },
  );
};

export default setupRoutes;
