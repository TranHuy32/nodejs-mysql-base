class TestService {
  async getTest(req) {
    try {
      return 'test'
    } catch (error) {
      console.error('Error sending message to LINE:', error);
      throw new Error('An internal server error occurred');
    }
  }
}

export default new TestService();
