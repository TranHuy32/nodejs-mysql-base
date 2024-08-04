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
}

export default new SchoolService();
