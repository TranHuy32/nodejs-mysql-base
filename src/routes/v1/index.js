import { Router } from 'express';
import user from './user';
import auth from './auth';
import school from './school';
import product from './product';
import category from './category';
import image from './image';
import order from './order';
import staffAssignment from './staffAssignment';

// Định nghĩa router với Express Router
const v1 = Router();

// Sử dụng router test và nối vào router v1
auth(v1);
user(v1);
school(v1);
product(v1);
category(v1);
image(v1);
order(v1);
staffAssignment(v1);

export default v1;
