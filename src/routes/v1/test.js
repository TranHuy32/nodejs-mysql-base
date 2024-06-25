import { Router } from 'express';
import TestService from '../../services/testService';
import { StatusCodes } from 'http-status-codes';
import { successHandler } from '../../helpers/responseHandler'

const route = Router();

const setupRoutes = (app) => {
  app.use('/test', route);

  route.get('/', async (req, res, next) => {
    try {
      const result = await TestService.getTest(req);
      return successHandler(res, 'success', result);
    } catch (err) {
      return next(err);
    }
  });
};

export default setupRoutes;
