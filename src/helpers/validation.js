import { StatusCodes } from 'http-status-codes';
import ApiError from '../helpers/ApiError';
import Joi from 'joi';

class Validation {
  validateRule = (req, rule) => {
    const { body } = req;
    const { error } = rule.validate(body);
    if (error) {
      const errorMessage =
        error.details?.[0]?.message || 'An internal server error occurred';
      throw new ApiError(errorMessage, StatusCodes.BAD_REQUEST);
    }
  };

  validateLogin = (req) => {
    const loginRule = Joi.object({
      phoneNumber: Joi.string().required().messages({
        'string.base': 'phoneNumber must be a string',
        'string.empty': 'phoneNumber is not allowed to be empty',
        'any.required': 'phoneNumber is a required field',
      }),
      password: Joi.string().required().messages({
        'string.base': 'password must be a string',
        'string.empty': 'password is not allowed to be empty',
        'any.required': 'password is a required field',
      }),
    });
    this.validateRule(req, loginRule);
    return req;
  };
}
module.exports = new Validation();
