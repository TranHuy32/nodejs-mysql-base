import db from '../models';
import ApiError from '../helpers/ApiError'
const User = db.User;

class UserService {
  async getAll(req) {
    try {
      // Create a new user
        // const test = await User.create({ name: 'Jane', password: '12345678', phone_number: '089371289' });
      const test = await User.findAll()
      return test;
    } catch (error) {
      console.error('error', error);
      throw new ApiError(error.message, error.status);
    }
  }
}

export default new UserService();
