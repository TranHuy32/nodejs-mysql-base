import { Router } from 'express';
import ProductService from '../../services/productService';
import { successHandler } from '../../helpers/responseHandler';
import { verifyAccessToken } from '../../middlewares/verifyToken';
import { UserRole } from '../../common/constants';
import upload from '../../middlewares/upload';

const route = Router();

const setupRoutes = (app) => {
    app.use('/product', route);

    route.post(
        '',
        verifyAccessToken([UserRole.ADMIN]),
        upload.single('image'),
        async (req, res, next) => {
            try {
                const result = await ProductService.create(req);
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
                const result = await ProductService.getAll(req);
                return successHandler(res, 'success', result);
            } catch (err) {
                return next(err);
            }
        },
    );
    
};

export default setupRoutes;