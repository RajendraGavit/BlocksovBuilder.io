/**
 * UDSP API Gateway
 * 
 * Main entry point for the API Gateway service.
 * Handles request routing, authentication, rate limiting, and service discovery.
 */

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import { createProxyMiddleware } from 'http-proxy-middleware';
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { createClient } from 'redis';

import { logger } from './utils/logger';
import { config } from './utils/config';
import { jwtAuth, optionalAuth } from './middleware/auth';
import { errorHandler } from './middleware/error-handler';
import { requestValidator } from './middleware/request-validator';
import { circuitBreaker } from './middleware/circuit-breaker';
import { healthRoutes } from './routes/health';

class APIGateway {
  private app: express.Application;
  private port: number;
  private redisClient: any;

  constructor() {
    this.app = express();
    this.port = config.port;
  }

  /**
   * Initialize Redis client for rate limiting
   */
  private async initializeRedis(): Promise<void> {
    try {
      this.redisClient = createClient({ url: config.redis.url });
      await this.redisClient.connect();
      logger.info('Redis client connected successfully');
    } catch (error) {
      logger.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  /**
   * Initialize middleware stack
   */
  private initializeMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
          fontSrc: ["'self'", "fonts.gstatic.com"],
          imgSrc: ["'self'", "data:", "https:"],
          scriptSrc: ["'self'"],
        },
      },
    }));

    // CORS configuration
    this.app.use(cors({
      origin: config.cors.allowedOrigins,
      credentials: true,
      optionsSuccessStatus: 200,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID', 'X-Request-ID'],
    }));

    // Body parsing and compression
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    this.app.use(compression());

    // Logging
    this.app.use(morgan('combined', {
      stream: { write: (message: string) => logger.info(message.trim()) },
    }));

    // Global rate limiting
    const rateLimiter = rateLimit({
      windowMs: config.rateLimit.windowMs,
      max: config.rateLimit.max,
      store: this.redisClient ? new RedisStore({
        sendCommand: (...args: string[]) => this.redisClient.sendCommand(args),
      }) : undefined,
      message: { error: 'Too many requests', message: 'Rate limit exceeded' },
      standardHeaders: true,
      legacyHeaders: false,
    });

    this.app.use(rateLimiter);

    // Request validation and circuit breaker
    this.app.use(requestValidator);
    this.app.use('/v1', circuitBreaker);

    logger.info('Middleware initialized successfully');
  }

  /**
   * Initialize API routes and service proxies
   */
  private initializeRoutes(): void {
    // Health check endpoints (no authentication required)
    this.app.use('/health', healthRoutes);

    // Service proxies with authentication
    this.setupServiceProxy('/v1/auth', config.services.auth, optionalAuth);
    this.setupServiceProxy('/v1/identities', config.services.identity, jwtAuth);
    this.setupServiceProxy('/v1/credentials', config.services.credential, jwtAuth);
    this.setupServiceProxy('/v1/blockchain', config.services.blockchain, jwtAuth);
    this.setupServiceProxy('/v1/compliance', config.services.compliance, jwtAuth);

    // Default route for API info
    this.app.get('/', (req, res) => {
      res.json({
        service: 'UDSP API Gateway',
        version: '1.0.0',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        endpoints: {
          health: '/health',
          auth: '/v1/auth',
          identities: '/v1/identities',
          credentials: '/v1/credentials',
          blockchain: '/v1/blockchain',
          compliance: '/v1/compliance',
        },
      });
    });

    logger.info('Routes initialized successfully');
  }

  /**
   * Setup service proxy with authentication
   */
  private setupServiceProxy(
    path: string,
    target: string,
    authMiddleware: express.RequestHandler,
  ): void {
    const proxy = createProxyMiddleware({
      target,
      changeOrigin: true,
      pathRewrite: { [`^${path}`]: '' },
      timeout: config.circuitBreaker.timeout,
      onError: (err, req, res) => {
        logger.error(`Proxy error for ${path}:`, err);
        (res as express.Response).status(503).json({
          error: 'Service Unavailable',
          message: 'Downstream service is not available',
          timestamp: new Date().toISOString(),
        });
      },
      onProxyReq: (proxyReq, req) => {
        // Add request ID for tracing
        const requestId = (req as any).headers['x-request-id'] || 
          `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        proxyReq.setHeader('X-Request-ID', requestId);

        // Forward user context
        if ((req as any).user) {
          proxyReq.setHeader('X-User-ID', (req as any).user.id);
          proxyReq.setHeader('X-Tenant-ID', (req as any).user.tenantId);
        }
      },
    });

    this.app.use(path, authMiddleware, proxy);
  }

  /**
   * Initialize error handling
   */
  private initializeErrorHandling(): void {
    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.originalUrl} not found`,
        timestamp: new Date().toISOString(),
      });
    });

    // Global error handler
    this.app.use(errorHandler);
  }

  /**
   * Start the server
   */
  public async start(): Promise<void> {
    try {
      await this.initializeRedis();
      this.initializeMiddleware();
      this.initializeRoutes();
      this.initializeErrorHandling();

      this.app.listen(this.port, () => {
        logger.info(`🚀 API Gateway started successfully`);
        logger.info(`📖 Server running on port ${this.port}`);
        logger.info(`🏥 Health Check: http://localhost:${this.port}/health`);
        logger.info(`🌐 Environment: ${config.nodeEnv}`);
      });
    } catch (error) {
      logger.error('Failed to start API Gateway:', error);
      process.exit(1);
    }
  }

  /**
   * Graceful shutdown
   */
  public async stop(): Promise<void> {
    logger.info('Shutting down API Gateway gracefully...');
    
    if (this.redisClient) {
      await this.redisClient.quit();
    }
    
    process.exit(0);
  }
}

// Handle process signals for graceful shutdown
const gateway = new APIGateway();

process.on('SIGTERM', () => gateway.stop());
process.on('SIGINT', () => gateway.stop());

// Start the server
gateway.start().catch((error) => {
  logger.error('Fatal error starting API Gateway:', error);
  process.exit(1);
});

export default APIGateway;
