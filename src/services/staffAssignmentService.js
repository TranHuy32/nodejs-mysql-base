import db from '../models';
import ApiError from '../helpers/ApiError';
import { StatusCodes } from 'http-status-codes';
const moment = require('moment');
const { Op } = require('sequelize');
import { UserRole } from '../common/constants';

const StaffAssignment = db.StaffAssignment;
const User = db.User;

class StaffAssignmentService {
  async create(req) {
    try {
      const { userId, productId } = req.body;
      const today = moment().startOf('day').toDate();
      const user = await User.findByPk(userId);
      console.log('today', today);

      if (!user || user.role !== UserRole.STAFF) {
        throw new ApiError(
          'User not found or not a staff',
          StatusCodes.BAD_REQUEST,
        );
      }

      const staffAssignment = await StaffAssignment.findOne({
        where: {
          product_id: productId,
          deleted_at: null,
          assign_date: {
            [Op.eq]: today,
          },
        },
      });
      console.log('staffAssignment', staffAssignment);

      if (!!staffAssignment) {
        throw new ApiError(
          'Staff assignment already exists',
          StatusCodes.BAD_REQUEST,
        );
      }

      const staffAssignmentCreated = await StaffAssignment.create({
        staff_id: userId,
        product_id: productId,
        assign_date: today, // Ensure the assign_date is set to today
      });

      return staffAssignmentCreated;
    } catch (error) {
      console.error('error', error);
      throw new ApiError(
        error.message,
        error.status || StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getAll(req) {
    try {
      const { date } = req.query;
      const queryDate = date
        ? moment(+date).startOf('day').toDate()
        : moment().startOf('day').toDate();
      const staffAssignments = await StaffAssignment.findAll({
        attributes: ['id', 'staff_id', 'product_id', 'assign_date'],
        where: {
          assign_date: {
            [Op.eq]: queryDate,
          },
          deleted_at: null,
        },
      });
      return staffAssignments;
    } catch (error) {
      console.error('error', error);
      throw new ApiError(
        error.message,
        error.status || StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

export default new StaffAssignmentService();
