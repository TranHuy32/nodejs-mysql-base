import db from '../models';
import ApiError from '../helpers/ApiError';
import { StatusCodes } from 'http-status-codes';
import { UnitEnum } from '../common/constants';

const { Product, Category } = db;

class ProductService {
  async create(req) {
    const { body, file } = req;
    const { name, unit, price, categoryId } = body;

    // Kiểm tra các trường bắt buộc
    if (!name || !unit || !price || !categoryId) {
      throw new ApiError('Missing required fields', StatusCodes.BAD_REQUEST);
    }

    // Kiểm tra xem unit có hợp lệ không
    if (!Object.values(UnitEnum).includes(unit)) {
      throw new ApiError('Invalid unit', StatusCodes.BAD_REQUEST);
    }

    // Kiểm tra xem categoryId có tồn tại không
    const category = await Category.findByPk(categoryId);
    if (!category) {
      throw new ApiError('Category does not exist', StatusCodes.BAD_REQUEST);
    }
    try {
      const productData = {
        name,
        unit,
        price: +price,
        category_id: categoryId,
        image_url: file ? file.filename : null,
      };

      // Lưu productData vào cơ sở dữ liệu
      const product = await Product.create(productData);
      return product;
    } catch (error) {
      console.error('error', error);
      throw new ApiError(error.message, error.status);
    }
  }

  async getAll(req) {
    try {
      const { pageSize = 20, page = 1, categoryId } = req.query; // Default limit to 20 and page to 1 if not provided
      const limit = parseInt(pageSize, 10);
      const currentPage = parseInt(page, 10);
      const offset = (currentPage - 1) * limit;

      // Build the where clause based on the filters
      const where = {};
      if (categoryId) {
        where.category_id = categoryId; // Assuming category is referenced by categoryId
      }
      const { count, rows: products } = await Product.findAndCountAll({
        where: where,
        limit: limit,
        offset: offset,
        attributes: ['id', 'name', 'image_url', 'price', 'created_at'], // Select specific attributes for Product
        include: [
          {
            model: Category,
            as: 'category',
            attributes: ['id', 'name'],
          },
        ],
        order: [['created_at', 'DESC']], // Sort by created_at in descending order
      });

      const totalPages = Math.ceil(count / limit);

      return {
        docs: products || [],
        paging: {
          totalItems: count,
          totalPages: totalPages,
          currentPage: currentPage,
          pageSize: limit,
        },
      };
    } catch (error) {
      console.error('error', error);
      throw new ApiError(error.message, error.status);
    }
  }
}
export default new ProductService();
