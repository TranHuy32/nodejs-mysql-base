import ApiError from '../helpers/ApiError';
import db from '../models';

const Car = db.Car;
const User = db.User;

class CarService {
  async getDetail(id) {
    try {
      const car = await Car.findOne({
        where: { id },
        include: [
          {
            model: User, // Model User
            attributes: ['id', 'name', 'phone_number'], // Các trường bạn muốn lấy từ User
          },
        ],
      });
      return car;
    } catch (error) {
      console.log('err: ', error);
    }
  }
}

export default new CarService();
