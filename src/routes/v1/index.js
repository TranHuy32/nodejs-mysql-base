import { Router } from 'express';
import user from './user';
import auth from './auth';

// Định nghĩa router với Express Router
const v1 = Router();

// Sử dụng router test và nối vào router v1
auth(v1)
user(v1);

export default v1;
