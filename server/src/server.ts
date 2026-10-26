import dotenv from 'dotenv';
dotenv.config();

import { createApp } from './app.js';
import { logger } from './utils/logger.js';

const PORT = parseInt(process.env.PORT || '8080', 10);
const HOST = '0.0.0.0';

const app = createApp();

const server = app.listen(PORT, HOST, () => {
  logger.info(`🚀 Masar AI Backend API running on http://${HOST}:${PORT}`);
  logger.info(`Health Check: http://${HOST}:${PORT}/health`);
  logger.info(`Readiness Probe: http://${HOST}:${PORT}/health/ready`);
  logger.info(`Applications API: http://${HOST}:${PORT}/api/applications`);
});

// Port conflict error handling (Phase 21)
server.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    logger.error(`Port ${PORT} is already in use by another process!`);
    console.error(`\n[PORT CONFLICT] Port ${PORT} is occupied.`);
    console.error(`To find and terminate the occupying process on Mac/Linux, run:`);
    console.error(`  lsof -i :${PORT}`);
    console.error(`  kill -9 <PID>\n`);
    process.exit(1);
  } else {
    logger.error('Server encountered a fatal startup error', err);
    process.exit(1);
  }
});

// Handle unhandled promise rejections safely
process.on('unhandledRejection', (reason: unknown) => {
  logger.error('Unhandled Promise Rejection caught in server process', reason);
});

process.on('uncaughtException', (err: Error) => {
  logger.error('Uncaught Exception caught in server process', err);
});

// Graceful Shutdown Handling (Phase 18)
const shutdown = (signal: string) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  server.close(() => {
    logger.info('HTTP server closed cleanly. Exiting process.');
    process.exit(0);
  });

  setTimeout(() => {
    logger.error('Graceful shutdown timed out after 10s. Forcing exit.');
    process.exit(1);
  }, 10000).unref();
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
