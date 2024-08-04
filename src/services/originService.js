import db from '../models';
import ApiError from '../helpers/ApiError';
import { StatusCodes } from 'http-status-codes';

const Origin = db.Origin;

class OriginService {
  async create(req) {
    try {
      const { name } = req.body;
      const origin = await Origin.findOne({
        where: { name, deleted_at: null },
      });

      if (!!origin) {
        throw new ApiError('Origin is existed', StatusCodes.BAD_REQUEST);
      }
      const originCreated = await Origin.create({
        name,
      });

      return originCreated;
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
      log;
      const { count, rows: origins } = await Origin.findAndCountAll({
        limit: limit,
        offset: offset,
      });

      const totalPages = Math.ceil(count / limit);

      return {
        docs: origins || [],
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

export default new OriginService();
