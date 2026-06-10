import { initializeSeeder, runAutoSeeder, shouldRunSeeder } from '../../seeders/autoSeeder.js';
import { successResponse, errorResponse } from '../../helpers/response.js';

/**
 * Check if database needs seeding
 * GET /api/admin/seed/status
 */
export const checkSeedStatus = async (req, res) => {
  try {
    const needsSeeding = await shouldRunSeeder();
    
    return successResponse(res, 200, "success", "Seed status checked", false, null, {
      needsSeeding,
      message: needsSeeding ? 'Database needs seeding' : 'Database already has initial data'
    });
  } catch (error) {
    return errorResponse(res, 500, "error", `Failed to check seed status: ${error.message}`);
  }
};

/**
 * Initialize seeder (runs only if needed)
 * POST /api/admin/seed
 */
export const initSeed = async (req, res) => {
  try {
    const result = await initializeSeeder();
    
    if (result.skipped) {
      return successResponse(res, 200, "success", result.message, false, null, result);
    }
    
    return successResponse(res, 201, "success", "Database seeded successfully", false, null, result);
  } catch (error) {
    return errorResponse(res, 500, "error", `Seeding failed: ${error.message}`);
  }
};

/**
 * Force run seeder (runs regardless of current data)
 * POST /api/admin/seed/force
 */
export const forceSeed = async (req, res) => {
  try {
    const result = await runAutoSeeder();
    
    return successResponse(res, 201, "success", "Database force seeded successfully", false, null, result);
  } catch (error) {
    return errorResponse(res, 500, "error", `Force seeding failed: ${error.message}`);
  }
};
