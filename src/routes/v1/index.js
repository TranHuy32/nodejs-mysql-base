import { Router } from 'express';
import test from './test';

// Định nghĩa router với Express Router
const v1 = Router();

// Sử dụng router test và nối vào router v1
test(v1);

export default v1;
