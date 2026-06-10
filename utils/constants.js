// =================================================================
// APPLICATION CONSTANTS
// =================================================================

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
};

// User Roles
export const USER_ROLES = {
  OWNER: 'Owner',
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  USER: 'User'
};

// Subscription Types
export const SUBSCRIPTION_TYPES = {
  FREE: 'Free',
  BASIC: 'Basic',
  PREMIUM: 'Premium',
  ENTERPRISE: 'Enterprise'
};

// Payment Status
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  SUCCESS: 'success',
  FAILED: 'failed',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled'
};

// Transaction Status
export const TRANSACTION_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SUCCESS: 'success',
  FAILED: 'failed',
  EXPIRED: 'expired'
};

// Invitation Status
export const INVITATION_STATUS = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  ARCHIVED: 'archived'
};

// Guest Status
export const GUEST_STATUS = {
  PENDING: 'pending',
  DELIVERED: 'delivered',
  ACCEPTED: 'accepted',
  DECLINED: 'declined'
};

// Attendance Status
export const ATTENDANCE_STATUS = {
  HADIR: 'hadir',
  TIDAK_HADIR: 'tidak_hadir',
  MUNGKIN: 'mungkin'
};

// System Message Types
export const MESSAGE_TYPES = {
  INFO: 'info',
  WARNING: 'warning',
  MAINTENANCE: 'maintenance',
  PROMO: 'promo'
};

// File Upload Limits
export const FILE_LIMITS = {
  IMAGE_MAX_SIZE: 5 * 1024 * 1024, // 5MB
  EXCEL_MAX_SIZE: 10 * 1024 * 1024, // 10MB
  DOCUMENT_MAX_SIZE: 20 * 1024 * 1024, // 20MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_EXCEL_TYPES: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel']
};

// Pagination Defaults
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100
};

// JWT Expiration Times
export const JWT_EXPIRY = {
  ACCESS_TOKEN: '1h',
  REFRESH_TOKEN: '7d',
  RESET_TOKEN: '15m',
  OTP_TOKEN: '5m'
};

// OTP Settings
export const OTP = {
  LENGTH: 6,
  EXPIRY_MINUTES: 5,
  MAX_ATTEMPTS: 3
};

// Email Templates
export const EMAIL_TEMPLATES = {
  WELCOME: 'welcome',
  VERIFICATION: 'verification',
  RESET_PASSWORD: 'reset-password',
  OTP: 'otp',
  INVITATION: 'invitation',
  PAYMENT_SUCCESS: 'payment-success'
};

// Date Formats
export const DATE_FORMATS = {
  DATE_ONLY: 'YYYY-MM-DD',
  DATETIME: 'YYYY-MM-DD HH:mm:ss',
  DISPLAY: 'DD MMM YYYY',
  DISPLAY_FULL: 'DD MMMM YYYY HH:mm'
};

// Regex Patterns
export const REGEX = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^(\+62|62|0)[0-9]{9,12}$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  USERNAME: /^[a-zA-Z0-9_-]{3,20}$/,
  URL: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/
};

// Error Messages
export const ERROR_MESSAGES = {
  VALIDATION_ERROR: 'Data validation failed',
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Access forbidden',
  NOT_FOUND: 'Resource not found',
  DUPLICATE_ENTRY: 'Record already exists',
  INTERNAL_ERROR: 'Internal server error',
  INVALID_TOKEN: 'Invalid or expired token',
  INVALID_CREDENTIALS: 'Invalid email or password'
};

// Success Messages
export const SUCCESS_MESSAGES = {
  CREATED: 'Resource created successfully',
  UPDATED: 'Resource updated successfully',
  DELETED: 'Resource deleted successfully',
  LOGIN_SUCCESS: 'Login successful',
  LOGOUT_SUCCESS: 'Logout successful',
  REGISTRATION_SUCCESS: 'Registration successful',
  EMAIL_SENT: 'Email sent successfully'
};

// Environment
export const ENVIRONMENT = {
  DEVELOPMENT: 'development',
  PRODUCTION: 'production',
  STAGING: 'staging',
  TEST: 'test'
};

export default {
  HTTP_STATUS,
  USER_ROLES,
  SUBSCRIPTION_TYPES,
  PAYMENT_STATUS,
  TRANSACTION_STATUS,
  INVITATION_STATUS,
  GUEST_STATUS,
  ATTENDANCE_STATUS,
  MESSAGE_TYPES,
  FILE_LIMITS,
  PAGINATION,
  JWT_EXPIRY,
  OTP,
  EMAIL_TEMPLATES,
  DATE_FORMATS,
  REGEX,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  ENVIRONMENT
};
