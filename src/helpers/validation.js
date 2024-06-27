import { StatusCodes } from 'http-status-codes';
import ApiError from '../helpers/ApiError';
import Joi from 'joi';
import { joiMessages } from '../common/validationErrorMessages';

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
      phoneNumber: Joi.string()
        .required()
        .min(2)
        .max(10)
        .regex(/^[0-9]{10}$/)
        .messages(joiMessages('phoneNumber')),
      password: Joi.string()
        .min(6)
        .required()
        .messages(joiMessages('password')),
    });
    this.validateRule(req, loginRule);
    return req;
  };

  validateRegister = (req) => {
    const loginRule = Joi.object({
      name: Joi.string().min(2).required().messages(joiMessages('name')),
      phoneNumber: Joi.string()
        .required()
        .min(2)
        .max(10)
        .regex(/^[0-9]{10}$/)
        .messages(joiMessages('phoneNumber')),
      password: Joi.string()
        .min(6)
        .required()
        .messages(joiMessages('password')),
    });
    this.validateRule(req, loginRule);
    return req;
  };
}
module.exports = new Validation();
