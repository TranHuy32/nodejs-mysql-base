import { Router } from 'express';
import user from './user';
import auth from './auth';
import school from './school';
import origin from './origin';

// Định nghĩa router với Express Router
const v1 = Router();

// Sử dụng router test và nối vào router v1
auth(v1);
user(v1);
school(v1);
origin(v1);

export default v1;
