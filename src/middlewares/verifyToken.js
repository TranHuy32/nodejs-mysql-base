import jwt from 'jsonwebtoken';
import ApiError from '../helpers/ApiError';

export const verifyAccessToken = (role) => (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) throw new ApiError('Access Denied', 401);
  const token = authHeader.replace('Bearer ', '');
  try {
    const user = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    if (!role.includes(user.role)) {
      throw new ApiError();
    }
    next();
  } catch (err) {
    throw new ApiError('Invalid Token', 400);
  }
};
