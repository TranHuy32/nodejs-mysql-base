import db from '../models'
const User = db.User;

class TestService {
  async getTest(req) {
    try {
      // Create a new user
      const test = await User.create({ firstName: 'Jane', lastName: 'Doe' });
      console.log("test's auto-generated ID:", test.id);
      return test;
    } catch (error) {
      console.error('error', error);
      throw new Error(error);
    }
  }
}

export default new TestService();
