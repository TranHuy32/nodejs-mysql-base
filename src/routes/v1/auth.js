import { Router } from 'express';
import Validation from '../../helpers/validation';
import { successHandler } from '../../helpers/responseHandler';
import AuthService from '../../services/authService';
import { verifyRefreshToken } from '../../middlewares/verifyToken';

const route = Router();

const setupRoutes = (app) => {
  app.use('/auth', route);

  route.post('/login', async (req, res, next) => {
    try {
      Validation.validateLogin(req);
      const result = await AuthService.login(req);
      successHandler(res, 'success', result);
    } catch (err) {
      return next(err);
    }
  });

  route.post('/register', async (req, res, next) => {
    try {
      Validation.validateRegister(req);
      const result = await AuthService.register(req);
      successHandler(res, 'success', result);
    } catch (err) {
      return next(err);
    }
  });

  route.post('/refresh', verifyRefreshToken, async (req, res, next) => {
    try {
      const result = await AuthService.refreshToken(req);
      successHandler(res, 'success', result);
    } catch (err) {
      return next(err);
    }
  });

  route.post('/logout', verifyRefreshToken, async (req, res, next) => {
    try {
      await AuthService.logout(req);
      successHandler(res, 'success');
    } catch (err) {
      return next(err);
    }
  });
};

export default setupRoutes;
