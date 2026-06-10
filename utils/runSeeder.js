#!/usr/bin/env node

/**
 * Standalone script to run the auto seeder
 * Usage: node seeders/runSeeder.js
 */

import { config } from 'dotenv';
import { runAutoSeeder, shouldRunSeeder } from './autoSeeder.js';
import db from '../config/database.js';

// Load environment variables
config();

const main = async () => {
  try {
    console.log('🚀 Starting seeder script...');
    
    // Test database connection
    await db.authenticate();
    console.log('✅ Database connection established');

    // Check if seeding is needed
    const needsSeeding = await shouldRunSeeder();
    
    if (!needsSeeding) {
      console.log('ℹ️  Database already contains initial data.');
      const shouldForce = process.argv.includes('--force');
      
      if (!shouldForce) {
        console.log('💡 Use --force flag to seed anyway: node seeders/runSeeder.js --force');
        process.exit(0);
      } else {
        console.log('🔄 Force flag detected. Running seeder anyway...');
      }
    }

    // Run the seeder
    const result = await runAutoSeeder();
    
    console.log('\n🎉 Seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   • Access Levels: ${result.data.accessLevels}`);
    console.log(`   • Roles: ${result.data.roles}`);
    console.log(`   • Users: ${result.data.users}`);
    console.log(`   • Categories: ${result.data.categories}`);
    console.log(`   • Templates: ${result.data.templates}`);
    console.log(`   • Payments: ${result.data.payments}`);
    console.log(`   • Discounts: ${result.data.discounts}`);
    console.log(`   • Subscriptions: ${result.data.subscriptions}`);
    console.log(`   • Prices: ${result.data.prices}`);
    console.log(`   • Kategori Pesans: ${result.data.kategoriPesans}`);
    console.log(`   • Template Pesans: ${result.data.templatePesans}`);
    console.log(`   • System Contents: ${result.data.systemContents}`);

    console.log('\n👤 Default Admin Accounts:');
    console.log('   • Super Admin: superadmin@microundangan.com (password: SuperAdmin123!)');
    console.log('   • Admin: admin@microundangan.com (password: Admin123!)');
    console.log('   • Owner: owner@microundangan.com (password: Owner123!)');
    console.log('   • Test User: user@microundangan.com (password: User123!)');

    console.log('\n🔐 Remember to change default passwords in production!');
    
  } catch (error) {
    console.error('❌ Seeder failed:', error);
    process.exit(1);
  } finally {
    // Close database connection
    await db.close();
    process.exit(0);
  }
};

// Run the main function
main();