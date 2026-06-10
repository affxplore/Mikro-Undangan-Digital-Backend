// =================================================================
// TEST SETUP & HELPERS
// =================================================================

import { jest } from '@jest/globals';

/**
 * Mock database connection
 */
export function mockDatabase() {
  return {
    transaction: jest.fn().mockResolvedValue({
      commit: jest.fn(),
      rollback: jest.fn(),
      LOCK: { UPDATE: 'UPDATE' }
    }),
    close: jest.fn()
  };
}

/**
 * Mock user object
 */
export function createMockUser(overrides = {}) {
  return {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    full_name: 'Test User',
    role_id: 3,
    subscription_id: 1,
    is_active: true,
    is_email_verified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  };
}

/**
 * Mock request object
 */
export function createMockRequest(options = {}) {
  return {
    body: {},
    params: {},
    query: {},
    headers: {},
    user: null,
    ...options
  };
}

/**
 * Mock response object
 */
export function createMockResponse() {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    redirect: jest.fn().mockReturnThis()
  };
  return res;
}

/**
 * Mock next function
 */
export function createMockNext() {
  return jest.fn();
}

/**
 * Delay helper for async tests
 */
export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Clean database helper (for integration tests)
 */
export async function cleanDatabase(models) {
  const modelNames = Object.keys(models);
  for (const modelName of modelNames) {
    if (models[modelName].destroy) {
      await models[modelName].destroy({ where: {}, force: true });
    }
  }
}

export default {
  mockDatabase,
  createMockUser,
  createMockRequest,
  createMockResponse,
  createMockNext,
  delay,
  cleanDatabase
};
