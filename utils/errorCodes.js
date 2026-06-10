// =================================================================
// ERROR CODES - APPLICATION-WIDE ERROR CODE DEFINITIONS
// =================================================================

/**
 * Error Code Structure: ERR-[CATEGORY]-[CODE]
 * Categories:
 * - AUTH: Authentication & Authorization
 * - VAL: Validation
 * - DB: Database
 * - FILE: File Operations
 * - PAY: Payment
 * - EMAIL: Email Services
 * - SYS: System
 */

export const ERROR_CODES = {
  // Authentication Errors (1000-1099)
  AUTH_TOKEN_MISSING: {
    code: 'ERR-AUTH-1001',
    message: 'Authentication token is missing',
    statusCode: 401
  },
  AUTH_TOKEN_INVALID: {
    code: 'ERR-AUTH-1002',
    message: 'Invalid or malformed token',
    statusCode: 401
  },
  AUTH_TOKEN_EXPIRED: {
    code: 'ERR-AUTH-1003',
    message: 'Token has expired',
    statusCode: 401
  },
  AUTH_INVALID_CREDENTIALS: {
    code: 'ERR-AUTH-1004',
    message: 'Invalid email or password',
    statusCode: 401
  },
  AUTH_USER_NOT_FOUND: {
    code: 'ERR-AUTH-1005',
    message: 'User not found',
    statusCode: 404
  },
  AUTH_USER_INACTIVE: {
    code: 'ERR-AUTH-1006',
    message: 'User account is inactive',
    statusCode: 403
  },
  AUTH_INSUFFICIENT_PERMISSIONS: {
    code: 'ERR-AUTH-1007',
    message: 'Insufficient permissions',
    statusCode: 403
  },
  AUTH_OTP_INVALID: {
    code: 'ERR-AUTH-1008',
    message: 'Invalid OTP code',
    statusCode: 400
  },
  AUTH_OTP_EXPIRED: {
    code: 'ERR-AUTH-1009',
    message: 'OTP has expired',
    statusCode: 400
  },

  // Validation Errors (2000-2099)
  VAL_REQUIRED_FIELD: {
    code: 'ERR-VAL-2001',
    message: 'Required field is missing',
    statusCode: 422
  },
  VAL_INVALID_FORMAT: {
    code: 'ERR-VAL-2002',
    message: 'Invalid data format',
    statusCode: 422
  },
  VAL_EMAIL_INVALID: {
    code: 'ERR-VAL-2003',
    message: 'Invalid email format',
    statusCode: 422
  },
  VAL_PASSWORD_WEAK: {
    code: 'ERR-VAL-2004',
    message: 'Password does not meet requirements',
    statusCode: 422
  },
  VAL_PHONE_INVALID: {
    code: 'ERR-VAL-2005',
    message: 'Invalid phone number format',
    statusCode: 422
  },
  VAL_DATE_INVALID: {
    code: 'ERR-VAL-2006',
    message: 'Invalid date format',
    statusCode: 422
  },
  VAL_DUPLICATE_ENTRY: {
    code: 'ERR-VAL-2007',
    message: 'Duplicate entry found',
    statusCode: 409
  },

  // Database Errors (3000-3099)
  DB_CONNECTION_FAILED: {
    code: 'ERR-DB-3001',
    message: 'Database connection failed',
    statusCode: 503
  },
  DB_QUERY_FAILED: {
    code: 'ERR-DB-3002',
    message: 'Database query execution failed',
    statusCode: 500
  },
  DB_RECORD_NOT_FOUND: {
    code: 'ERR-DB-3003',
    message: 'Record not found in database',
    statusCode: 404
  },
  DB_CONSTRAINT_VIOLATION: {
    code: 'ERR-DB-3004',
    message: 'Database constraint violation',
    statusCode: 409
  },
  DB_TRANSACTION_FAILED: {
    code: 'ERR-DB-3005',
    message: 'Database transaction failed',
    statusCode: 500
  },

  // File Operation Errors (4000-4099)
  FILE_UPLOAD_FAILED: {
    code: 'ERR-FILE-4001',
    message: 'File upload failed',
    statusCode: 500
  },
  FILE_TOO_LARGE: {
    code: 'ERR-FILE-4002',
    message: 'File size exceeds maximum limit',
    statusCode: 413
  },
  FILE_INVALID_TYPE: {
    code: 'ERR-FILE-4003',
    message: 'Invalid file type',
    statusCode: 415
  },
  FILE_NOT_FOUND: {
    code: 'ERR-FILE-4004',
    message: 'File not found',
    statusCode: 404
  },
  FILE_DELETE_FAILED: {
    code: 'ERR-FILE-4005',
    message: 'File deletion failed',
    statusCode: 500
  },

  // Payment Errors (5000-5099)
  PAY_GATEWAY_ERROR: {
    code: 'ERR-PAY-5001',
    message: 'Payment gateway error',
    statusCode: 502
  },
  PAY_TRANSACTION_FAILED: {
    code: 'ERR-PAY-5002',
    message: 'Payment transaction failed',
    statusCode: 400
  },
  PAY_INSUFFICIENT_BALANCE: {
    code: 'ERR-PAY-5003',
    message: 'Insufficient balance',
    statusCode: 400
  },
  PAY_INVALID_AMOUNT: {
    code: 'ERR-PAY-5004',
    message: 'Invalid payment amount',
    statusCode: 422
  },
  PAY_VOUCHER_INVALID: {
    code: 'ERR-PAY-5005',
    message: 'Invalid or expired voucher code',
    statusCode: 400
  },
  PAY_VOUCHER_USED: {
    code: 'ERR-PAY-5006',
    message: 'Voucher code already used',
    statusCode: 400
  },

  // Email Errors (6000-6099)
  EMAIL_SEND_FAILED: {
    code: 'ERR-EMAIL-6001',
    message: 'Failed to send email',
    statusCode: 500
  },
  EMAIL_TEMPLATE_NOT_FOUND: {
    code: 'ERR-EMAIL-6002',
    message: 'Email template not found',
    statusCode: 404
  },
  EMAIL_INVALID_RECIPIENT: {
    code: 'ERR-EMAIL-6003',
    message: 'Invalid email recipient',
    statusCode: 422
  },

  // System Errors (9000-9099)
  SYS_INTERNAL_ERROR: {
    code: 'ERR-SYS-9001',
    message: 'Internal server error',
    statusCode: 500
  },
  SYS_SERVICE_UNAVAILABLE: {
    code: 'ERR-SYS-9002',
    message: 'Service temporarily unavailable',
    statusCode: 503
  },
  SYS_MAINTENANCE: {
    code: 'ERR-SYS-9003',
    message: 'System under maintenance',
    statusCode: 503
  },
  SYS_RATE_LIMIT_EXCEEDED: {
    code: 'ERR-SYS-9004',
    message: 'Rate limit exceeded',
    statusCode: 429
  }
};

/**
 * Custom Application Error Class
 */
export class AppError extends Error {
  constructor(errorCode, additionalInfo = null) {
    const error = ERROR_CODES[errorCode] || ERROR_CODES.SYS_INTERNAL_ERROR;
    super(error.message);
    
    this.name = 'AppError';
    this.code = error.code;
    this.statusCode = error.statusCode;
    this.additionalInfo = additionalInfo;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Get error by code
 */
export function getErrorByCode(code) {
  return ERROR_CODES[code] || ERROR_CODES.SYS_INTERNAL_ERROR;
}

/**
 * Check if error is operational
 */
export function isOperationalError(error) {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
}

export default {
  ERROR_CODES,
  AppError,
  getErrorByCode,
  isOperationalError
};
