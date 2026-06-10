// =================================================================
// LOGGER UTILITY - CONSOLE LOGGING FOR DEVELOPMENT
// =================================================================
// For production, consider using winston or pino

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure logs directory exists
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Log levels
const LOG_LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  HTTP: 'HTTP',
  DEBUG: 'DEBUG'
};

// Colors for console output
const COLORS = {
  ERROR: '\x1b[31m', // Red
  WARN: '\x1b[33m',  // Yellow
  INFO: '\x1b[36m',  // Cyan
  HTTP: '\x1b[35m',  // Magenta
  DEBUG: '\x1b[37m', // White
  RESET: '\x1b[0m'
};

/**
 * Format log message
 */
function formatMessage(level, message, meta = {}) {
  const timestamp = new Date().toISOString();
  const metaStr = Object.keys(meta).length > 0 ? JSON.stringify(meta, null, 2) : '';
  return `[${timestamp}] [${level}] ${message} ${metaStr}`;
}

/**
 * Write to log file
 */
function writeToFile(level, message) {
  const date = new Date().toISOString().split('T')[0];
  const logFile = path.join(logsDir, `${date}.log`);
  
  try {
    fs.appendFileSync(logFile, message + '\n', 'utf8');
  } catch (error) {
    console.error('Failed to write to log file:', error);
  }
}

/**
 * Write error stack to separate file
 */
function writeErrorStack(error) {
  const date = new Date().toISOString().split('T')[0];
  const errorFile = path.join(logsDir, `${date}-errors.log`);
  
  const errorLog = `
========================================
Time: ${new Date().toISOString()}
Error: ${error.message}
Stack: ${error.stack}
========================================
`;
  
  try {
    fs.appendFileSync(errorFile, errorLog, 'utf8');
  } catch (err) {
    console.error('Failed to write error stack:', err);
  }
}

/**
 * Logger class
 */
class Logger {
  constructor(context = 'App') {
    this.context = context;
  }

  log(level, message, meta = {}) {
    const color = COLORS[level] || COLORS.RESET;
    const formatted = formatMessage(level, `[${this.context}] ${message}`, meta);
    
    // Console output with colors (development)
    if (process.env.NODE_ENV !== 'production') {
      console.log(`${color}${formatted}${COLORS.RESET}`);
    }
    
    // File output (all environments)
    writeToFile(level, formatted);
  }

  error(message, error = null, meta = {}) {
    const errorMeta = error ? {
      ...meta,
      errorMessage: error.message,
      errorCode: error.code,
      errorStack: error.stack
    } : meta;
    
    this.log(LOG_LEVELS.ERROR, message, errorMeta);
    
    // Write full error stack to separate file
    if (error) {
      writeErrorStack(error);
    }
  }

  warn(message, meta = {}) {
    this.log(LOG_LEVELS.WARN, message, meta);
  }

  info(message, meta = {}) {
    this.log(LOG_LEVELS.INFO, message, meta);
  }

  http(message, meta = {}) {
    this.log(LOG_LEVELS.HTTP, message, meta);
  }

  debug(message, meta = {}) {
    if (process.env.NODE_ENV !== 'production') {
      this.log(LOG_LEVELS.DEBUG, message, meta);
    }
  }
}

// Create default logger instance
const logger = new Logger('App');

/**
 * Create logger with custom context
 */
export function createLogger(context) {
  return new Logger(context);
}

/**
 * HTTP Request Logger Middleware
 */
export function httpLogger(req, res, next) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusColor = res.statusCode >= 400 ? COLORS.ERROR : COLORS.INFO;
    
    logger.http(`${req.method} ${req.originalUrl}`, {
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent')
    });
  });
  
  next();
}

/**
 * Global Error Handler
 */
export function errorLogger(err, req, res, next) {
  logger.error('Unhandled error', err, {
    method: req.method,
    url: req.originalUrl,
    body: req.body,
    params: req.params,
    query: req.query
  });
  
  next(err);
}

// Export default logger
export default logger;

// Export logger methods directly
export const { error, warn, info, http, debug } = logger;
