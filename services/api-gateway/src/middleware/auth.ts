/**
 * JWT Authentication middleware for API Gateway
 */

import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { config } from '../utils/config';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        tenantId: string;
        roles: string[];
        tier?: string;
        permissions?: string[];
      };
      tenantId?: string;
    }
  }
}

interface JWTPayload {
  sub: string;
  email: string;
  tenantId: string;
  roles: string[];
  tier?: string;
  permissions?: string[];
  iat: number;
  exp: number;
  type?: 'user' | 'service';
}

export const jwtAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authorization header is required',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    let token: string;
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (authHeader.startsWith('Service ')) {
      token = authHeader.substring(8);
    } else {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid authorization header format',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;
    
    if (!decoded.sub || !decoded.tenantId) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid token payload',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    req.user = {
      id: decoded.sub,
      email: decoded.email || 'unknown@udsp.io',
      tenantId: decoded.tenantId,
      roles: decoded.roles || [],
      tier: decoded.tier,
      permissions: decoded.permissions || [],
    };
    req.tenantId = decoded.tenantId;

    next();
  } catch (error) {
    logger.error('JWT authentication error:', error);
    
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid token',
        timestamp: new Date().toISOString(),
      });
    } else if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Token expired',
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Authentication service error',
        timestamp: new Date().toISOString(),
      });
    }
  }
};

export const optionalAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;
  
  if (authHeader) {
    try {
      await jwtAuth(req, res, next);
    } catch (error) {
      next();
    }
  } else {
    next();
  }
};

export const requireRole = (requiredRoles: string | string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = req.user;
    
    if (!user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    const hasRole = roles.some(role => user.roles.includes(role));
    
    if (!hasRole) {
      res.status(403).json({
        error: 'Forbidden',
        message: `Required roles: ${roles.join(', ')}`,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    next();
  };
};
