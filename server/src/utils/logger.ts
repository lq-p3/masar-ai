export interface LogContext {
  method?: string;
  path?: string;
  statusCode?: number;
  durationMs?: number;
  [key: string]: unknown;
}

export const logger = {
  info: (message: string, context?: LogContext) => {
    const timestamp = new Date().toISOString();
    if (process.env.NODE_ENV === 'production') {
      console.log(JSON.stringify({ severity: 'INFO', message, timestamp, ...context }));
    } else {
      console.log(`[INFO] ${timestamp} - ${message}`, context ? JSON.stringify(context) : '');
    }
  },

  warn: (message: string, context?: LogContext) => {
    const timestamp = new Date().toISOString();
    if (process.env.NODE_ENV === 'production') {
      console.warn(JSON.stringify({ severity: 'WARNING', message, timestamp, ...context }));
    } else {
      console.warn(`[WARN] ${timestamp} - ${message}`, context ? JSON.stringify(context) : '');
    }
  },

  error: (message: string, error?: unknown, context?: LogContext) => {
    const timestamp = new Date().toISOString();
    const errData = error instanceof Error 
      ? { name: error.name, message: error.message } 
      : { details: String(error) };

    if (process.env.NODE_ENV === 'production') {
      console.error(JSON.stringify({ severity: 'ERROR', message, timestamp, error: errData, ...context }));
    } else {
      console.error(`[ERROR] ${timestamp} - ${message}`, errData, context ? JSON.stringify(context) : '');
    }
  }
};
