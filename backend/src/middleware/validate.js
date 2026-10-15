import { validationResult } from 'express-validator';
import ApiError from '../utils/ApiError.js';

// Collects express-validator failures into a 400 ApiError.
export const validate = (req, _res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      ApiError.badRequest(errors.array().map((e) => e.msg).join(', '))
    );
  }
  return next();
};

export default validate;
