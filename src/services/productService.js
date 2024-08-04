import db from '../models';
import ApiError from '../helpers/ApiError';
import { StatusCodes } from 'http-status-codes';
import { UnitEnum } from '../common/constants';

const { Product, Category, Origin } = db;

class ProductService {
  async create(req) {
    const { body, file } = req;
    const { name, unit, price, categoryId, originId } = body;

    // Kiểm tra các trường bắt buộc
    if (!name || !unit || !price || !categoryId || !originId) {
      throw new ApiError('Missing required fields', StatusCodes.BAD_REQUEST);
    }

    // Kiểm tra xem unit có hợp lệ không
    if (!Object.values(UnitEnum).includes(unit)) {
      throw new ApiError('Invalid unit', StatusCodes.BAD_REQUEST);
    }

    // Kiểm tra xem categoryId và originId có tồn tại không
    const category = await Category.findByPk(categoryId);
    if (!category) {
      throw new ApiError('Category does not exist', StatusCodes.BAD_REQUEST);
    }

    const origin = await Origin.findByPk(originId);
    if (!origin) {
      throw new ApiError('Origin does not exist', StatusCodes.BAD_REQUEST);
    }

    try {
      const productData = {
        name,
        unit,
        price: +price,
        category_id: categoryId,
        origin_id: originId,
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
      const { pageSize = 20, page = 1, categoryId, originId } = req.query; // Default limit to 20 and page to 1 if not provided
      const limit = parseInt(pageSize, 10);
      const currentPage = parseInt(page, 10);
      const offset = (currentPage - 1) * limit;

      // Build the where clause based on the filters
      const where = {};
      if (categoryId) {
        where.category_id = categoryId; // Assuming category is referenced by categoryId
      }
      if (originId) {
        where.origin_id = originId; // Assuming origin is referenced by originId
      }

      const { count, rows: products } = await Product.findAndCountAll({
        where: where,
        limit: limit,
        offset: offset,
        include: [
          {
            model: Category,
            as: 'category',
            attributes: ['id', 'name'],
          },
          {
            model: Origin,
            as: 'origin',
            attributes: ['id', 'name'],
          },
        ],
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