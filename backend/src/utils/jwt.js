import jwt from 'jsonwebtoken';
import authConfig from '../config/auth.js';

export const signToken = (payload) =>
  jwt.sign(payload, authConfig.jwtSecret, { algorithm: 'HS256', expiresIn: authConfig.jwtExpiresIn });

export const verifyToken = (token) =>
  jwt.verify(token, authConfig.jwtSecret, { algorithms: ['HS256'] });

export default { signToken, verifyToken };
