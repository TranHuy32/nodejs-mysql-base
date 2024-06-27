import bcrypt from 'bcrypt';
import ApiError from '../helpers/ApiError';
import * as CryptoJS from 'crypto-js';

class CommonService {
  hashPassword(password) {
    try {
      const saltRounds = 10;
      return bcrypt.hashSync(password, saltRounds);
    } catch (error) {
      console.log('[ERROR] hashPassword: ', error);
      throw new ApiError(error.message);
    }
  }

  hashToken(token) {
    try {
      return CryptoJS.SHA256(token).toString(CryptoJS.enc.Base64);
    } catch (error) {
      console.log('[ERROR] hashToken: ', error);
      throw new ApiError(error.message);
    }
  }
}

export default new CommonService();
