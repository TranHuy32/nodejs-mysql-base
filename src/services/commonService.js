import bcrypt from 'bcrypt';
import ApiError from '../helpers/ApiError'

class CommonService {
  async hashPassword(password) {
    try {
      const saltRounds = 10;
      return bcrypt.hashSync(password, saltRounds);
    } catch (error) {
      console.log('[ERROR] hashPassword: ', error);
      throw new ApiError(error.message);
    }
  }
}

export default new CommonService();
