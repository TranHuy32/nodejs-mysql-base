import { Router } from 'express';
import { successHandler } from '../../helpers/responseHandler';
import CarService from '../../services/carService';

const route = Router();

const setupRoutes = (app) => {
  app.use('/car', route);

  route.get('/detail/:id', async (req, res, next) => {
    try {
      const { id } = req.params;
      const result = await CarService.getDetail(id);
      return successHandler(res, 'success', result);
    } catch (err) {
      return next(err);
    }
  });
};

export default setupRoutes;
