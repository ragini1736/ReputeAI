import jwt from 'jsonwebtoken';

import { JWT_SECRET } from '../config.js';

export function auth(req, res, next) {

  const header =
    req.headers.authorization || '';

  const [type, token] =
    header.split(' ');

  if (
    type !== 'Bearer' ||
    !token
  ) {
    return res.status(401).json({
      error: 'Authentication required'
    });
  }

  try {

    const payload =
      jwt.verify(token, JWT_SECRET);

    req.businessId =
      payload.business_id;

    next();

  } catch (error) {

    return res.status(401).json({
      error: 'Invalid or expired token'
    });

  }
}