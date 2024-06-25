import { Router } from 'express';
import apiv1 from './v1';
import { errorHandler } from '../helpers/responseHandler';

// This serves as the root path definition, define root paths here
const app = Router();

app.use('/v1', apiv1);
app.use(errorHandler);

export default app;
