/**
 * Request validation middleware
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export const requestValidator = (req: Request, res: Response, next: NextFunction): void => {
  // Add request ID for tracing
  const requestId = req.headers['x-request-id'] as string || 
    `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  req.headers['x-request-id'] = requestId;
  res.setHeader('X-Request-ID', requestId);

  // Log incoming request
  logger.info('Incoming request', {
    requestId,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  next();
};
