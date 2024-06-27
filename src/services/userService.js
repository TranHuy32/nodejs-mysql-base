import db from '../models';
import ApiError from '../helpers/ApiError';

const User = db.User;

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
}

export default new UserService();
