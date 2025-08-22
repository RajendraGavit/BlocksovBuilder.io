/**
 * Health check routes
 */

import { Router, Request, Response } from 'express';
import { config } from '../utils/config';

const router = Router();

// Basic health check
router.get('/', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'UDSP API Gateway',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.nodeEnv,
  });
});

// Detailed health check
router.get('/detailed', async (req: Request, res: Response) => {
  const health = {
    status: 'healthy',
    service: 'UDSP API Gateway',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.nodeEnv,
    dependencies: {
      redis: await checkRedis(),
      services: await checkDownstreamServices(),
    },
    system: {
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      nodeVersion: process.version,
    },
  };

  const isHealthy = health.dependencies.redis.status === 'healthy' &&
    Object.values(health.dependencies.services).every(service => service.status === 'healthy');

  res.status(isHealthy ? 200 : 503).json(health);
});

// Readiness probe
router.get('/ready', (req: Request, res: Response) => {
  res.json({
    status: 'ready',
    timestamp: new Date().toISOString(),
  });
});

// Liveness probe  
router.get('/live', (req: Request, res: Response) => {
  res.json({
    status: 'alive',
    timestamp: new Date().toISOString(),
  });
});

async function checkRedis(): Promise<{ status: string; responseTime?: number }> {
  // TODO: Implement actual Redis health check
  return { status: 'healthy', responseTime: 5 };
}

async function checkDownstreamServices(): Promise<Record<string, { status: string; responseTime?: number }>> {
  // TODO: Implement actual service health checks
  return {
    identity: { status: 'healthy', responseTime: 10 },
    auth: { status: 'healthy', responseTime: 8 },
    credential: { status: 'healthy', responseTime: 12 },
    blockchain: { status: 'healthy', responseTime: 15 },
    compliance: { status: 'healthy', responseTime: 20 },
  };
}

export { router as healthRoutes };
