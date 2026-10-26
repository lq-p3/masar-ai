import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import routes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';
import { logger } from './utils/logger.js';

dotenv.config();

export function createApp(): Express {
  const app = express();

  // Cloud Run runs behind a reverse proxy
  app.set('trust proxy', 1);

  // 1. Disable x-powered-by header for security
  app.disable('x-powered-by');

  // 2. HTTP Security Headers with Helmet
  app.use(helmet());

  // 3. CORS Configuration
  const defaultOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://masar-ai-frontend-828667104263.us-west4.run.app'
  ];

  const envOrigins = (process.env.FRONTEND_ORIGINS || process.env.FRONTEND_ORIGIN || '')
    .split(',')
    .map(o => o.trim())
    .filter(Boolean);

  const allowedOrigins = Array.from(new Set([...defaultOrigins, ...envOrigins]));
  logger.info(`Configuring CORS for allowed frontend origins: ${allowedOrigins.join(', ')}`);

  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (server-to-server, curl) or matching allowed origins
      if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
        callback(null, true);
      } else {
        logger.warn(`Blocked CORS request from origin: ${origin}`);
        callback(new Error('Not allowed by CORS policy'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));

  // 4. Rate Limiting (Phase 19)
  const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10);
  const maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10);

  const limiter = rateLimit({
    windowMs,
    max: maxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: {
        code: 'TOO_MANY_REQUESTS',
        message: 'Too many requests from this IP, please try again after 15 minutes.'
      }
    }
  });

  app.use('/api/', limiter);

  // 5. JSON Body Parser with 1MB limit
  app.use(express.json({ limit: '1mb' }));

  // 6. Request Duration & Structured Logging (Phase 8)
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const durationMs = Date.now() - start;
      logger.info(`HTTP ${req.method} ${req.path}`, {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        durationMs
      });
    });
    next();
  });

  // 7. Mount API Routes
  app.use('/', routes);

  // 8. Error & 404 Handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
