/**
 * Configuration management for API Gateway
 */

import { logger } from './logger';

interface Config {
  port: number;
  nodeEnv: string;
  jwt: {
    secret: string;
    expiresIn: string;
  };
  redis: {
    url: string;
  };
  rateLimit: {
    windowMs: number;
    max: number;
  };
  cors: {
    allowedOrigins: string[];
  };
  services: {
    identity: string;
    credential: string;
    auth: string;
    blockchain: string;
    compliance: string;
  };
  circuitBreaker: {
    timeout: number;
    errorThresholdPercentage: number;
    resetTimeoutMs: number;
  };
}

function loadConfig(): Config {
  const config: Config = {
    port: parseInt(process.env.PORT || '8080', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    jwt: {
      secret: process.env.JWT_SECRET || 'super-secret-jwt-key',
      expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    },
    redis: {
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    },
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '900000', 10),
      max: parseInt(process.env.RATE_LIMIT_MAX || '1000', 10),
    },
    cors: {
      allowedOrigins: process.env.CORS_ORIGINS 
        ? process.env.CORS_ORIGINS.split(',')
        : ['http://localhost:3000'],
    },
    services: {
      identity: process.env.IDENTITY_SERVICE_URL || 'http://identity-service:3001',
      credential: process.env.CREDENTIAL_SERVICE_URL || 'http://credential-service:3003',
      auth: process.env.AUTH_SERVICE_URL || 'http://auth-service:3002',
      blockchain: process.env.BLOCKCHAIN_SERVICE_URL || 'http://blockchain-adapter:3004',
      compliance: process.env.COMPLIANCE_SERVICE_URL || 'http://compliance-service:3005',
    },
    circuitBreaker: {
      timeout: parseInt(process.env.CIRCUIT_BREAKER_TIMEOUT || '5000', 10),
      errorThresholdPercentage: parseInt(process.env.CIRCUIT_BREAKER_ERROR_THRESHOLD || '50', 10),
      resetTimeoutMs: parseInt(process.env.CIRCUIT_BREAKER_RESET_TIMEOUT || '60000', 10),
    },
  };

  validateConfig(config);
  return config;
}

function validateConfig(config: Config): void {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!config.jwt.secret || config.jwt.secret === 'super-secret-jwt-key') {
    if (config.nodeEnv === 'production') {
      errors.push('JWT_SECRET must be set in production');
    } else {
      warnings.push('Using default JWT_SECRET - change this for production');
    }
  }

  if (config.jwt.secret.length < 32) {
    errors.push('JWT_SECRET must be at least 32 characters long');
  }

  warnings.forEach(warning => logger.warn(`Configuration warning: ${warning}`));

  if (errors.length > 0) {
    const errorMessage = `Configuration errors:\\n${errors.join('\\n')}`;
    logger.error(errorMessage);
    throw new Error(errorMessage);
  }

  logger.info('Configuration validated successfully');
}

export const config = loadConfig();
export default config;
