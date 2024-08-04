import db from '../models';
import ApiError from '../helpers/ApiError';
import { Op } from 'sequelize';
import { UserRole } from '../common/constants';

const User = db.User;
const School = db.School;

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
}
export default new UserService();
