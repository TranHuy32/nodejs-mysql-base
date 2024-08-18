import db from '../models';
import ApiError from '../helpers/ApiError';
import { TokenType, UserRole } from '../common/constants';
import { StatusCodes } from 'http-status-codes';
import bcrypt from 'bcrypt';
import CommonService from '../services/commonService';
import jwt from 'jsonwebtoken';

const User = db.User;
const School = db.School;

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
      console.error('createToken', error);
      throw new ApiError(error.message);
    }
  }

  async login(req) {
    try {
      const { username, password } = req.body;
      const user = await User.findOne({
        where: { username, deleted_at: null },
        include: [
          {
            model: School,
            as: 'school',
            attributes: ['name'],
          },
        ],
      });
      if (!user) {
        throw new ApiError(
          'Username or Password is not correct',
          StatusCodes.UNPROCESSABLE_ENTITY,
        );
      }

      const { password: hashedPassword, school, ...payload } = user.toJSON();
      payload.schoolName = school?.name
      const valid = bcrypt.compareSync(password, hashedPassword);
      if (!valid) {
        throw new ApiError(
          'Username or Password is not correct',
          StatusCodes.UNPROCESSABLE_ENTITY,
        );
      }
      const token = {
        accessToken: await this.createToken(payload, TokenType.ACCESS_TOKEN),
        refreshToken: await this.createToken(payload, TokenType.REFRESH_TOKEN),
        user: payload,
      };
      return token;
    } catch (error) {
      console.log('error', error);
      throw new ApiError(error.message, error.status);
    }
  }

  async register(req) {
    try {
      const existUser = await User.findOne({
        where: { username: 'admin' },
      });
      if (!!existUser) {
        throw new ApiError('admin is existed', StatusCodes.BAD_REQUEST);
      }

      const userCreated = await User.create({
        name: 'admin',
        username: 'admin',
        password: process.env.ADMIN_PASSWORD,
        role: UserRole.ADMIN,
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

  async createUser(req) {
    try {
      const { name, username, password, role, schoolId } = req.body;
      const existUser = await User.findOne({
        where: { username, deleted_at: null },
      });
      if (!!existUser) {
        throw new ApiError('username is existed', StatusCodes.BAD_REQUEST);
      }
      if (role === UserRole.ADMIN) {
        throw new ApiError('Access Denied', StatusCodes.BAD_REQUEST);
      }
      const createUser = {
        name,
        username,
        password,
        role,
      };
      if (role === UserRole.USER) {
        if (!schoolId) {
          throw new ApiError('School is required', StatusCodes.BAD_REQUEST);
        }
        const existSchool = await School.findByPk(schoolId);
        if (!existSchool) {
          throw new ApiError('School is not existed', StatusCodes.BAD_REQUEST);
        }
        createUser.school_id = schoolId;
      }
      const createdUser = await User.create(createUser);
      if (!createdUser) {
        throw new ApiError(
          'Error creating user',
          StatusCodes.INTERNAL_SERVER_ERROR,
        );
      }
      const { password: createdPassword, ...result } = createdUser.get({
        plain: true,
      });
      return result;
    } catch (error) {
      console.log('error', error);

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
