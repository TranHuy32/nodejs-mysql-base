import db from '../models';
import ApiError from '../helpers/ApiError';

const School = db.School;

class SchoolService {
  async create(req) {
    try {
      const { name, address, contact_number } = req.body;
      const { password, ...result } = await School.findOne({
        where: { name, deleted_at: null },
      }).then((res) => (!!res ? res.toJSON() : {}));
      if (!!result) {
        throw new ApiError('School is existed', StatusCodes.BAD_REQUEST);
      }
      return result;
    } catch (error) {
      console.error('error', error);
      throw new ApiError(error.message, error.status);
    }
  }
}

export default new SchoolService();
