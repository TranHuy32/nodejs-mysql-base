import db from '../models';
import ApiError from '../helpers/ApiError';
import { TokenType } from '../common/constants';
import { StatusCodes } from 'http-status-codes';
import bcrypt from 'bcrypt';
var jwt = require('jsonwebtoken');

const User = db.User;

class AuthService {
  async createToken(payload, type) {
    try {
      const {
        ACCESS_TOKEN_SECRET,
        REFRESH_TOKEN_SECRET,
        ACCESS_EXPIRES_IN,
        REFRESH_EXPIRES_IN,
      } = process.env;
      const tokenSecret =
        type === TokenType.ACCESS_TOKEN
          ? ACCESS_TOKEN_SECRET
          : REFRESH_TOKEN_SECRET;
      const expiresIn =
        type === TokenType.ACCESS_TOKEN
          ? ACCESS_EXPIRES_IN
          : REFRESH_EXPIRES_IN;
      if (!tokenSecret) {
        throw new ApiError();
      }
      return jwt.sign(payload, tokenSecret, { expiresIn });
    } catch (error) {
      throw new ApiError(error.message);
    }
  }

  async login(req) {
    try {
      const { phoneNumber: phone_number, password } = req.body;

      const user = await User.findOne({ where: { phone_number } });
      if (!user) {
        throw new ApiError(
          'PhoneNumber or Password is not correct',
          StatusCodes.UNPROCESSABLE_ENTITY
        );
      }

      const { password: hashedPassword, ...payload } = user.toJSON();

      const valid = bcrypt.compareSync(password, hashedPassword);
      if (!valid) {
        throw new ApiError(
          'PhoneNumber or Password is not correct',
          StatusCodes.UNPROCESSABLE_ENTITY
        );
      }
      return {
        accessToken: await this.createToken(payload, TokenType.ACCESS_TOKEN),
        refreshToken: await this.createToken(payload, TokenType.REFRESH_TOKEN),
      };
    } catch (error) {
      throw new ApiError(error.message, error.status);
    }
  }
}

export default new AuthService();
