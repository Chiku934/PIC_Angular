import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { db } from '@/config/database';
import { logger } from '@/utils/logger';
import { config } from '@/config/environment';
import { errorHandler } from '@/middleware/error.middleware';
import { notFoundHandler } from '@/middleware/error.middleware';
import { validateEnvironment } from '@/config/environment';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

// Import routes
import authRoutes from '@/routes/auth.routes';
import userRoutes from '@/routes/user.routes';
import certificateRoutes from '@/routes/certificate.routes';
import factoryRoutes from '@/routes/factories.routes';
import dashboardRoutes from '@/routes/dashboard.routes';

class Application {
  public app: express.Application;
  public server: any;

  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeSwagger();
    this.initializeErrorHandling();
  }

  private initializeMiddlewares(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }));

    // CORS configuration
    this.app.use(cors({
      origin: config.CORS_ORIGIN,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: config.RATE_LIMIT_WINDOW,
      max: config.RATE_LIMIT_MAX,
      message: {
        error: 'Too many requests from this IP, please try again later.',
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use('/api/', limiter);

    // Compression
    this.app.use(compression());

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Logging middleware
    this.app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));
  }

  private initializeRoutes(): void {
    // Health check endpoint
    this.app.get('/health', (_req, res) => {
      res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: config.NODE_ENV,
        version: config.APP_VERSION,
      });
    });

    // API routes
    this.app.use('/api/auth', authRoutes);
    this.app.use('/api/users', userRoutes);
    this.app.use('/api/certificates', certificateRoutes);
    this.app.use('/api/factories', factoryRoutes);
    this.app.use('/api/dashboard', dashboardRoutes);

    // Root endpoint
    this.app.get('/', (_req, res) => {
      res.json({
        message: 'PIC Certificates Management System API',
        version: config.APP_VERSION,
        environment: config.NODE_ENV,
        documentation: '/api-docs',
      });
    });
  }

  private initializeSwagger(): void {
    const options = {
      definition: {
        openapi: '3.0.0',
        info: {
        title: 'PIC Certificates Management System API',
        version: config.APP_VERSION,
        description: 'Professional API for managing certificates, factories, and users',
          contact: {
            name: 'PIC Development Team',
            email: 'dev@pic.com',
          },
        },
        servers: [
          {
            url: config.APP_URL,
            description: 'Development server',
          },
        ],
        components: {
          securitySchemes: {
            bearerAuth: {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT',
            },
          },
        },
        security: [
          {
            bearerAuth: [],
          },
        ],
      },
      apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
    };

    const specs = swaggerJsdoc(options);
    this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
      explorer: true,
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'PIC Certificates API Documentation',
    }));
  }

  private initializeErrorHandling(): void {
    this.app.use(notFoundHandler);
    this.app.use(errorHandler);
  }

  public async start(): Promise<void> {
    try {
      // Validate environment variables
      validateEnvironment();

      // Test database connection
      try {
        await db.authenticate();
        logger.info('Database connection established successfully');

        // Sync database and seed default data
        // await db.sync({ force: false });
        // await seedDefaultData();
        // logger.info('Database synchronized and seeded');
        logger.info('Using mock data for development');
      } catch (error) {
        logger.warn('Database connection failed, using mock data:', error);
      }

      // Start server
      this.server.listen(config.PORT, () => {
        logger.info(`🚀 Server running on port ${config.PORT}`);
        logger.info(`📚 API Documentation: http://localhost:${config.PORT}/api-docs`);
        logger.info(`🏥 Health Check: http://localhost:${config.PORT}/health`);
        logger.info(`🌍 Environment: ${config.NODE_ENV}`);
      });

      // Graceful shutdown
      process.on('SIGTERM', this.gracefulShutdown.bind(this));
      process.on('SIGINT', this.gracefulShutdown.bind(this));

    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  private async gracefulShutdown(signal: string): Promise<void> {
    logger.info(`Received ${signal}. Starting graceful shutdown...`);
    
    this.server.close(async () => {
      logger.info('HTTP server closed');
      
      try {
        await db.close();
        logger.info('Database connection closed');
        process.exit(0);
      } catch (error) {
        logger.error('Error during shutdown:', error);
        process.exit(1);
      }
    });

    // Force close after 30 seconds
    setTimeout(() => {
      logger.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 30000);
  }
}

// Start the application
const application = new Application();
application.start().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});

export default application;
