import db from '../models';
import ApiError from '../helpers/ApiError';

const User = db.User;
const Car = db.Car;

class UserService {
  async getAll(req) {
    try {
      const user = await User.findAll();
      return user || [];
    } catch (error) {
      console.error('error', error);
      throw new ApiError(error.message, error.status);
    }
  }

  async getDetail(req) {
    try {
      const { id } = req.user;
      const { password, ...result } = await User.findOne({
        where: { id },
        include: [
          {
            model: Car,
            attributes: ['id', 'name', 'color', 'manufacturer'],
          },
        ],
      }).then((res) => (!!res ? res.toJSON() : {}));

      return result;
    } catch (error) {
      console.error('error', error);
      throw new ApiError(error.message, error.status);
    }
  }
}

export default new UserService();
