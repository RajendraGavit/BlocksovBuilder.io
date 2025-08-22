/**
 * Circuit breaker middleware for downstream services
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { config } from '../utils/config';

interface CircuitState {
  failures: number;
  lastFailureTime: number;
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
}

const circuits = new Map<string, CircuitState>();

export const circuitBreaker = (req: Request, res: Response, next: NextFunction): void => {
  const serviceName = getServiceFromPath(req.path);
  
  if (!serviceName) {
    next();
    return;
  }

  const circuit = getOrCreateCircuit(serviceName);
  
  if (circuit.state === 'OPEN') {
    const timeSinceLastFailure = Date.now() - circuit.lastFailureTime;
    
    if (timeSinceLastFailure < config.circuitBreaker.resetTimeoutMs) {
      res.status(503).json({
        error: 'Service Unavailable',
        message: 'Circuit breaker is OPEN',
        timestamp: new Date().toISOString(),
      });
      return;
    } else {
      circuit.state = 'HALF_OPEN';
      logger.info(`Circuit breaker for ${serviceName} moved to HALF_OPEN`);
    }
  }

  // Track response for circuit breaker
  const originalSend = res.send;
  res.send = function(data) {
    if (res.statusCode >= 500) {
      recordFailure(serviceName);
    } else {
      recordSuccess(serviceName);
    }
    return originalSend.call(this, data);
  };

  next();
};

function getServiceFromPath(path: string): string | null {
  const match = path.match(/^\/v1\/(\w+)/);
  return match ? match[1] : null;
}

function getOrCreateCircuit(serviceName: string): CircuitState {
  if (!circuits.has(serviceName)) {
    circuits.set(serviceName, {
      failures: 0,
      lastFailureTime: 0,
      state: 'CLOSED',
    });
  }
  return circuits.get(serviceName)!;
}

function recordFailure(serviceName: string): void {
  const circuit = getOrCreateCircuit(serviceName);
  circuit.failures++;
  circuit.lastFailureTime = Date.now();

  const failureRate = circuit.failures / 10; // Simple failure rate calculation
  
  if (failureRate >= config.circuitBreaker.errorThresholdPercentage / 100) {
    circuit.state = 'OPEN';
    logger.warn(`Circuit breaker for ${serviceName} opened due to high failure rate`);
  }
}

function recordSuccess(serviceName: string): void {
  const circuit = getOrCreateCircuit(serviceName);
  
  if (circuit.state === 'HALF_OPEN') {
    circuit.state = 'CLOSED';
    circuit.failures = 0;
    logger.info(`Circuit breaker for ${serviceName} closed after successful request`);
  } else {
    circuit.failures = Math.max(0, circuit.failures - 1);
  }
}
