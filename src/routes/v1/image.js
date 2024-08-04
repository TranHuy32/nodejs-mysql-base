import { serveImage } from '../../services/imageService';
import { Router } from 'express';


const route = Router();

const setupRoutes = (app) => {
    app.use('/images', route);
    route.get('/:filename', serveImage);

};

export default setupRoutes;
