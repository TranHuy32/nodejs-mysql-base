import db from '../models';
import ApiError from '../helpers/ApiError';
import { Op, where } from 'sequelize';
import { UserRole } from '../common/constants';
import bcrypt from 'bcrypt';
import { StatusCodes } from 'http-status-codes';
import CommonService from './commonService';

const User = db.User;
const School = db.School;
const UserSchool = db.UserSchool;

class UserService {
  async getAll(req) {
    try {
      const { pageSize = 20, page = 1, role, schoolId } = req.query; // Default limit to 20 and page to 1 if not provided
      const limit = parseInt(pageSize, 10);
      const currentPage = parseInt(page, 10);
      const offset = (currentPage - 1) * limit;

      const whereClause = {
        role: {
          [Op.in]: [UserRole.STAFF, UserRole.USER], // Include only staff or user roles
          [Op.not]: UserRole.ADMIN, // Exclude admin role
        },
      };

      if (role && role !== UserRole.ADMIN) {
        whereClause.role = role;
      }

      if (role === UserRole.USER && schoolId) {
        whereClause.school_id = schoolId;
      }

      const { count, rows: users } = await User.findAndCountAll({
        where: whereClause,
        limit: limit,
        offset: offset,
      });

      const totalPages = Math.ceil(count / limit);

      return {
        docs: users || [],
        paging: {
          totalItems: count,
          totalPages: totalPages,
          currentPage: currentPage,
          pageSize: limit,
        },
      };
    } catch (error) {
      console.error('error', error);
      throw new ApiError(error.message, error.status);
    }
  }

  async getDetail(req) {
    try {
      const { id } = req.user;
      const user = await User.findOne({
        where: { id },
        include: [
          {
            model: School,
            as: 'school',
            attributes: ['id', 'name', 'contact_number', 'address'],
          },
        ],
      }).then((res) => (!!res ? res.toJSON() : {}));
      const { password, school_id, ...result } = user;

      return result;
    } catch (error) {
      console.error('error', error);
      throw new ApiError(error.message, error.status);
    }
  }

  async updateUser(req) {
    try {
      const { id } = req.user;
      const { oldPassword, newPassword } = req.body;
      const user = await User.findOne({ where: { id } });

      if (!user) {
        throw new ApiError('User not found', StatusCodes.BAD_REQUEST);
      }
      const { password, ...result } = user.toJSON();
      if (oldPassword && newPassword) {
        const valid = bcrypt.compareSync(oldPassword, password);
        if (!valid) {
          throw new ApiError(
            'oldPassword is not correct',
            StatusCodes.UNPROCESSABLE_ENTITY,
          );
        }
        const hashedPassword = CommonService.hashPassword(newPassword);
        await User.update(
          { password: hashedPassword },
          {
            where: { id },
          },
        );
        return { id };
      }
    } catch (error) {
      console.error('error', error);
      throw new ApiError(error.message, error.status);
    }
  }

  async delete(req) {
    try {
      const { id } = req.params;
      const user = await User.findOne({ where: { id } });

      if (!user) {
        throw new ApiError('User not found', StatusCodes.BAD_REQUEST);
      }
      if (user.acvite === false) {
        throw new ApiError('User is not active', StatusCodes.BAD_REQUEST);
      }

      await User.update(
        { deleted_at: new Date() },
        {
          where: { id },
        },
      );
      return { id };
    } catch (error) {
      console.error('error', error);
      throw new ApiError(error.message, error.status);
    }
  }

  async assign(req) {
    try {
      const { userId, schoolId } = req.body;
      const user = await User.findByPk(userId);
      if (!user) {
        throw new ApiError('User not found', StatusCodes.BAD_REQUEST);
      }
      if (user.role !== UserRole.STAFF) {
        throw new ApiError('User is not staff', StatusCodes.BAD_REQUEST);
      }
      const school = await School.findByPk(schoolId);
      if (!school) {
        throw new ApiError('School not found', StatusCodes.BAD_REQUEST);
      }
      const userSchool = await UserSchool.findOne({
        where: { school_id: schoolId },
      });

      if (!!userSchool) {
        await UserSchool.update(
          { deleted_at: new Date() },
          {
            where: { id: userSchool.id },
          },
        );
      }
      const newUserSchool = await UserSchool.create({
        user_id: userId,
        school_id: schoolId,
      });
      return newUserSchool;
    } catch (error) {
      console.error('error', error);
      throw new ApiError(error.message, error.status);
    }
  }
}
export default new UserService();
