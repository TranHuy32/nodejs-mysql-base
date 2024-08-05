import { Router } from 'express';
import StaffAssignmentService from '../../services/staffAssignmentService';
import { successHandler } from '../../helpers/responseHandler';
import { verifyAccessToken } from '../../middlewares/verifyToken';
import { UserRole } from '../../common/constants';

const route = Router();

const setupRoutes = (app) => {
  app.use('/staff-assignment', route);

  route.post(
    '',
    verifyAccessToken([UserRole.ADMIN]),
    async (req, res, next) => {
      try {
        const result = await StaffAssignmentService.create(req);
        return successHandler(res, 'success', result);
      } catch (err) {
        return next(err);
      }
    },
  );

  route.get(
    '',
    verifyAccessToken([UserRole.ADMIN, UserRole.STAFF]),
    async (req, res, next) => {
      try {
        const result = await StaffAssignmentService.getAll(req);
        return successHandler(res, 'success', result);
      } catch (err) {
        return next(err);
      }
    },
  );
};

export default setupRoutes;
