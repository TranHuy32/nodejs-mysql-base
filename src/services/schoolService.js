import db from '../models';
import ApiError from '../helpers/ApiError';
import { StatusCodes } from 'http-status-codes';

const School = db.School;

class SchoolService {
  async create(req) {
    try {
      const { name, address, contact_number } = req.body;
      const school = await School.findOne({
        where: { name, deleted_at: null },
      });

      if (!!school) {
        throw new ApiError('School is existed', StatusCodes.BAD_REQUEST);
      }
      const schoolCreated = await School.create({
        name,
        address,
        contact_number,
      });

      return schoolCreated;
    } catch (error) {
      console.error('error', error);
      throw new ApiError(error.message, error.status);
    }
  }

  async getAll(req) {
    try {
      const { pageSize = 20, page = 1 } = req.query; // Default limit to 20 and page to 1 if not provided
      const limit = parseInt(pageSize, 10);
      const currentPage = parseInt(page, 10);
      const offset = (currentPage - 1) * limit;
      const { count, rows: schools } = await School.findAndCountAll({
        limit: limit,
        offset: offset,
      });

      const totalPages = Math.ceil(count / limit);

      return {
        docs: schools || [],
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
}

export default new SchoolService();
