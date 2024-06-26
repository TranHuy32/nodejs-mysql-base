import { Router } from 'express';
import Validation from '../../helpers/validation';
import { successHandler } from '../../helpers/responseHandler';
import AuthService from '../../services/authService';
const route = Router();

const setupRoutes = (app) => {
  app.use('/auth', route);

  route.post('/login', async (req, res, next) => {
    try {
      Validation.validateLogin(req);
      const result = await AuthService.login(req);
      return successHandler(res, 'success', result);
    } catch (err) {
      return next(err);
    }
  });
};

export default setupRoutes;
