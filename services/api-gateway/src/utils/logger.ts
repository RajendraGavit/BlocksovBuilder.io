/**
 * Centralized logging utility for API Gateway
 */

import winston from 'winston';

const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

winston.addColors(logColors);

const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
);

const jsonFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf((info) => {
    return JSON.stringify({
      timestamp: info.timestamp,
      level: info.level,
      message: info.message,
      service: 'api-gateway',
      ...info,
    });
  }),
);

const createTransports = (): winston.transport[] => {
  const transports: winston.transport[] = [];
  const isProduction = process.env.NODE_ENV === 'production';
  const logLevel = process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug');

  transports.push(
    new winston.transports.Console({
      level: logLevel,
      format: isProduction ? jsonFormat : consoleFormat,
    }),
  );

  return transports;
};

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels: logLevels,
  transports: createTransports(),
  exitOnError: false,
});

export const createChildLogger = (context: Record<string, any>) => {
  return logger.child(context);
};

export default logger;
