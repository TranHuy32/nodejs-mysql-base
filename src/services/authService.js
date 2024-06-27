import db from '../models';
import ApiError from '../helpers/ApiError';
import { TokenType, UserRole } from '../common/constants';
import { StatusCodes } from 'http-status-codes';
import bcrypt from 'bcrypt';
import CommonService from '../services/commonService';
import jwt from 'jsonwebtoken';

const User = db.User;
const Token = db.Token;

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
      if (!tokenSecret || !expiresIn) {
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
          StatusCodes.UNPROCESSABLE_ENTITY,
        );
      }

      const { password: hashedPassword, ...payload } = user.toJSON();

      const valid = bcrypt.compareSync(password, hashedPassword);
      if (!valid) {
        throw new ApiError(
          'PhoneNumber or Password is not correct',
          StatusCodes.UNPROCESSABLE_ENTITY,
        );
      }
      const token = {
        accessToken: await this.createToken(payload, TokenType.ACCESS_TOKEN),
        refreshToken: await this.createToken(payload, TokenType.REFRESH_TOKEN),
      };
      await Token.create({ token: token.refreshToken, user_id: user.id });
      return token;
    } catch (error) {
      throw new ApiError(error.message, error.status);
    }
  }

  async register(req) {
    try {
      const { name, phoneNumber: phone_number, password } = req.body;
      const existUser = await User.findOne({
        where: { phone_number },
      });
      if (!!existUser) {
        throw new ApiError('phoneNumber is existed', StatusCodes.BAD_REQUEST);
      }
      const userCreated = await User.create({
        name,
        phone_number,
        password,
        role: UserRole.USER,
      });
      if (!userCreated) {
        throw new ApiError(
          'Error creating user',
          StatusCodes.INTERNAL_SERVER_ERROR,
        );
      }
      const { password: createdPassword, ...result } = userCreated.get({
        plain: true,
      });
      return result;
    } catch (error) {
      throw new ApiError(error.message, error.status);
    }
  }

  async refreshToken(req) {
    try {
      const { id, refreshToken } = req.user;

      const hashedRefreshToken = !!refreshToken
        ? CommonService.hashToken(refreshToken)
        : null;
      if (!hashedRefreshToken) {
        throw new ApiError('Invalid Token', 400);
      }

      const existedToken = await Token.findOne({
        where: { token: hashedRefreshToken, user_id: id },
      });

      const { password, ...user } = await User.findByPk(id, { raw: true });
      if (!existedToken || !user) {
        throw new ApiError('Invalid Token', 400);
      }

      const token = {
        accessToken: await this.createToken(user, TokenType.ACCESS_TOKEN),
        refreshToken: await this.createToken(user, TokenType.REFRESH_TOKEN),
      };

      existedToken.token = CommonService.hashToken(token.refreshToken);
      await existedToken.save({ fields: ['token'] });
      return token;
    } catch (error) {
      throw new ApiError(error.message, error.status);
    }
  }

  async logout(req) {
    try {
      const { id, refreshToken } = req.user;

      const hashedRefreshToken = !!refreshToken
        ? CommonService.hashToken(refreshToken)
        : null;
      if (!hashedRefreshToken) {
        throw new ApiError('Invalid Token', 400);
      }

      const existedToken = await Token.findOne({
        where: { token: hashedRefreshToken, user_id: id },
      });
      if (!!existedToken) {
        await existedToken.destroy();
      }
      return;
    } catch (error) {
      throw new ApiError(error.message, error.status);
    }
  }
}

export default new AuthService();
