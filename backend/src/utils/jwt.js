import jwt from 'jsonwebtoken';
import authConfig from '../config/auth.js';

export const signToken = (payload) =>
  jwt.sign(payload, authConfig.jwtSecret, { expiresIn: authConfig.jwtExpiresIn });

export const verifyToken = (token) => jwt.verify(token, authConfig.jwtSecret);

export default { signToken, verifyToken };
