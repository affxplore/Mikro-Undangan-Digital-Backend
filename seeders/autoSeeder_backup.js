import db from '../config/database.js';
import bcrypt from 'bcrypt';

// Import all models
import Category from '../models/category.js';
import Payment from '../models/payment.js';
import Discount from '../models/discount.js';
import Subscription from '../models/subscription.js';
import SystemContent from '../models/systemContent.js';
import AccessLv from '../models/accessLv.js';
import Role, { RoleAccessLv } from '../models/role.js';
import User from '../models/user.js';
import Template from '../models/template.js';


/**
 * Auto seeder function to populate database with initial data
 * This will run when database is first initialized
 */
export const runAutoSeeder = async () => {
  const transaction = await db.transaction();
  
  try {
    console.log('🌱 Starting auto seeder...');

    // 1. Seed Access Levels
    const accessLevels = await seedAccessLevels(transaction);
    console.log('✅ Access levels seeded');

    // 2. Seed Roles
    const roles = await seedRoles(transaction, accessLevels);
    console.log('✅ Roles seeded');

    // 3. Seed Users (Admin)
    const users = await seedUsers(transaction, roles);
    console.log('✅ Users seeded');

    // 4. Seed Categories
    const categories = await seedCategories(transaction);
    console.log('✅ Categories seeded');

    // 5. Seed Templates
    const templates = await seedTemplates(transaction, categories);
    console.log('✅ Templates seeded');

    // 6. Seed Payments
    const payments = await seedPayments(transaction);
    console.log('✅ Payments seeded');

    // 7. Seed Discounts
    const discounts = await seedDiscounts(transaction);
    console.log('✅ Discounts seeded');

    // 8. Seed Subscriptions
    const subscriptions = await seedSubscriptions(transaction);
    console.log('✅ Subscriptions seeded');

    // 9. Seed System Content
    const systemContents = await seedSystemContent(transaction);
    console.log('✅ System content seeded');

    

    await transaction.commit();
    console.log('🎉 Auto seeder completed successfully!');
    
    return {
      success: true,
      message: 'Database seeded successfully',
      data: {
        accessLevels: accessLevels.length,
        roles: roles.length,
        users: users.length,
        categories: categories.length,
        templates: templates.length,
        payments: payments.length,
        discounts: discounts.length,
        subscriptions: subscriptions.length,
        systemContents: systemContents.length,
        
      }
    };

  } catch (error) {
    await transaction.rollback();
    console.error('❌ Auto seeder failed:', error);
    throw error;
  }
};

/**
 * Seed Access Levels
 */
const seedAccessLevels = async (transaction) => {
  const accessLevelsData = [
   {
    "code": "DB_R",
    "description": "Melihat halaman Dashboard"
  },
  {
    "code": "DB_C",
    "description": "Menambah data di Dashboard"
  },
  {
    "code": "DB_U",
    "description": "Mengubah data di Dashboard"
  },
  {
    "code": "DB_D",
    "description": "Menghapus data di Dashboard"
  },
  {
    "code": "WS_R",
    "description": "Melihat halaman Website"
  },
  {
    "code": "WS_C",
    "description": "Menambah data di Website"
  },
  {
    "code": "WS_U",
    "description": "Mengubah data di Website"
  },
  {
    "code": "WS_D",
    "description": "Menghapus data di Website"
  },
  {
    "code": "AF_R",
    "description": "Melihat data Affiliate"
  },
  {
    "code": "AF_C",
    "description": "Menambah data Affiliate"
  },
  {
    "code": "AF_U",
    "description": "Mengubah data Affiliate"
  },
  {
    "code": "AF_D",
    "description": "Menghapus data Affiliate"
  },
  {
    "code": "RP_R",
    "description": "Melihat Laporan"
  },
  {
    "code": "RP_C",
    "description": "Membuat Laporan"
  },
  {
    "code": "RP_U",
    "description": "Mengubah Laporan"
  },
  {
    "code": "RP_D",
    "description": "Menghapus Laporan"
  },
  {
    "code": "SS_R",
    "description": "Melihat Pengaturan Sistem"
  },
  {
    "code": "SS_C",
    "description": "Membuat Pengaturan Sistem"
  },
  {
    "code": "SS_U",
    "description": "Mengubah Pengaturan Sistem"
  },
  {
    "code": "SS_D",
    "description": "Menghapus Pengaturan Sistem"
  },
  {
    "code": "CA_R",
    "description": "Melihat data Kategori"
  },
  {
    "code": "CA_C",
    "description": "Membuat data Kategori"
  },
  {
    "code": "CA_U",
    "description": "Mengubah data Kategori"
  },
  {
    "code": "CA_D",
    "description": "Menghapus data Kategori"
  },
  {
    "code": "DC_R",
    "description": "Melihat data Diskon"
  },
  {
    "code": "DC_C",
    "description": "Membuat data Diskon"
  },
  {
    "code": "DC_U",
    "description": "Mengubah data Diskon"
  },
  {
    "code": "DC_D",
    "description": "Menghapus data Diskon"
  },
  {
    "code": "IV_R",
    "description": "Melihat data Undangan"
  },
  {
    "code": "IV_C",
    "description": "Membuat data Undangan"
  },
  {
    "code": "IV_U",
    "description": "Mengubah data Undangan"
  },
  {
    "code": "IV_D",
    "description": "Menghapus data Undangan"
  },
  {
    "code": "KU_R",
    "description": "Melihat data Kata Ucapan"
  },
  {
    "code": "KU_C",
    "description": "Membuat data Kata Ucapan"
  },
  {
    "code": "KU_U",
    "description": "Mengubah data Kata Ucapan"
  },
  {
    "code": "KU_D",
    "description": "Menghapus data Kata Ucapan"
  },
  {
    "code": "PY_R",
    "description": "Melihat data Pembayaran"
  },
  {
    "code": "PY_C",
    "description": "Membuat data Pembayaran"
  },
  {
    "code": "PY_U",
    "description": "Mengubah data Pembayaran"
  },
  {
    "code": "PY_D",
    "description": "Menghapus data Pembayaran"
  },
  {
    "code": "PJ_R",
    "description": "Melihat data Proyek"
  },
  {
    "code": "PJ_C",
    "description": "Membuat data Proyek"
  },
  {
    "code": "PJ_U",
    "description": "Mengubah data Proyek"
  },
  {
    "code": "PJ_D",
    "description": "Menghapus data Proyek"
  },
  {
    "code": "RI_R",
    "description": "Melihat data Undangan Diterima"
  },
  {
    "code": "RI_C",
    "description": "Membuat data Undangan Diterima"
  },
  {
    "code": "RI_U",
    "description": "Mengubah data Undangan Diterima"
  },
  {
    "code": "RI_D",
    "description": "Menghapus data Undangan Diterima"
  },
  {
    "code": "RL_R",
    "description": "Melihat data Peran Pengguna"
  },
  {
    "code": "RL_C",
    "description": "Membuat data Peran Pengguna"
  },
  {
    "code": "RL_U",
    "description": "Mengubah data Peran Pengguna"
  },
  {
    "code": "RL_D",
    "description": "Menghapus data Peran Pengguna"
  },
  {
    "code": "SU_R",
    "description": "Melihat data Kategori Pesan Undangan"
  },
  {
    "code": "SU_C",
    "description": "Membuat data Kategori Pesan Undangan"
  },
  {
    "code": "SU_U",
    "description": "Mengubah data Kategori Pesan Undangan"
  },
  {
    "code": "SU_D",
    "description": "Menghapus data Kategori Pesan Undangan"
  },
  {
    "code": "SB_R",
    "description": "Melihat data Langganan"
  },
  {
    "code": "SB_C",
    "description": "Membuat data Langganan"
  },
  {
    "code": "SB_U",
    "description": "Mengubah data Langganan"
  },
  {
    "code": "SB_D",
    "description": "Menghapus data Langganan"
  },
  {
    "code": "SC_R",
    "description": "Melihat Konten Sistem"
  },
  {
    "code": "SC_C",
    "description": "Membuat Konten Sistem"
  },
  {
    "code": "SC_U",
    "description": "Mengubah Konten Sistem"
  },
  {
    "code": "SC_D",
    "description": "Menghapus Konten Sistem"
  },
  {
    "code": "TM_R",
    "description": "Melihat data Template"
  },
  {
    "code": "TM_C",
    "description": "Membuat data Template"
  },
  {
    "code": "TM_U",
    "description": "Mengubah data Template"
  },
  {
    "code": "TM_D",
    "description": "Menghapus data Template"
  },
  {
    "code": "US_R",
    "description": "Melihat data Pengguna"
  },
  {
    "code": "US_C",
    "description": "Membuat data Pengguna"
  },
  {
    "code": "US_U",
    "description": "Mengubah data Pengguna"
  },
  {
    "code": "US_D",
    "description": "Menghapus data Pengguna"
  },
  {
    "code": "TR_R",
    "description": "Membaca data transaksi"
  },
  {
    "code": "TR_C",
    "description": "Membuat data transaksi"
  }
  ];

  const createdAccessLevels = [];
  for (const accessLvData of accessLevelsData) {
    const [accessLv, created] = await AccessLv.findOrCreate({
      where: { code: accessLvData.code },
      defaults: accessLvData,
      transaction
    });
    createdAccessLevels.push(accessLv);
  }

  return createdAccessLevels;
};

/**
 * Seed Roles
 */
const seedRoles = async (transaction, accessLevels) => {
  const rolesData = [
  {
    "name": "Super Admin",
    "description": "Full system access with all permissions",
    "accessLevelIds": accessLevels.map(al => al.id) // Logika: Ambil semua izin.
  },
  {
    "name": "Admin",
    "description": "Administrative access with most permissions",
    "accessLevelIds": accessLevels
      .filter(al => !al.code.startsWith('RL_')) // Logika: Semua izin KECUALI manajemen peran (RL_).
      .map(al => al.id)
  },
    {
    "name": "User",
    "description": "Regular user with basic permissions",
    "accessLevelIds": accessLevels
      .filter(al => {
        // Logika: Akses sangat terbatas, hanya melihat dashboard dan proyek.
        const allowedCodes = ['DB_R', 'PJ_R'];
        return allowedCodes.includes(al.code);
      })
      .map(al => al.id)
  },
  {
    "name": "Owner",
    "description": "Business owner with management permissions",
    "accessLevelIds": accessLevels
      .filter(al => {
        // Logika: Akses ke modul bisnis (laporan, user, proyek, pembayaran)
        // tapi BUKAN konfigurasi sistem mendalam (template, system content, roles).
        const excludedPrefixes = ['SS_', 'SC_', 'TM_', 'RL_'];
        return !excludedPrefixes.some(prefix => al.code.startsWith(prefix));
      })
      .map(al => al.id)
  },
  {
    "name": "Manager",
    "description": "Manager with limited administrative access",
    "accessLevelIds": accessLevels
      .filter(al => {
        // Logika: Akses hanya ke modul operasional (Proyek, Undangan, User) dan melihat Dashboard.
        const allowedPrefixes = ['PJ_', 'IV_', 'SU_', 'US_'];
        return allowedPrefixes.some(prefix => al.code.startsWith(prefix)) || al.code === 'DB_R';
      })
      .map(al => al.id)
  }

];

  const createdRoles = [];
  for (const roleData of rolesData) {
    const [role, created] = await Role.findOrCreate({
      where: { name: roleData.name },
      defaults: {
        name: roleData.name,
        description: roleData.description
      },
      transaction
    });

    // Create role-access level associations
    if (created || roleData.accessLevelIds) {
      // Remove existing associations
      await RoleAccessLv.destroy({
        where: { role_id: role.id },
        transaction
      });

      // Create new associations
      for (const accessLevelId of roleData.accessLevelIds) {
        await RoleAccessLv.create({
          role_id: role.id,
          access_lv_id: accessLevelId
        }, { transaction });
      }
    }

    createdRoles.push(role);
  }

  return createdRoles;
};

/**
 * Seed Users (Admin accounts)
 */
const seedUsers = async (transaction, roles) => {
  const saltRounds = 10;
  
//   // Find roles
//   const superAdminRole = roles.find(r => r.name === 'Super Admin');
//   const adminRole = roles.find(r => r.name === 'Admin');
//   const ownerRole = roles.find(r => r.name === 'Owner');
//   const userRole = roles.find(r => r.name === 'User');

//   const usersData = [
//     {
//       username: 'superadmin',
//       full_name: 'Super Administrator',
//       whatsapp_number: '+6281234567890',
//       email: 'superadmin@microundangan.com',
//       password: await bcrypt.hash('SuperAdmin123!', saltRounds),
//       role_id: superAdminRole.id,
//       isActive: true,
//       subscription: 'Premium'
//     },
//     {
//       username: 'admin',
//       full_name: 'System Administrator',
//       whatsapp_number: '+6281234567891',
//       email: 'admin@microundangan.com',
//       password: await bcrypt.hash('Admin123!', saltRounds),
//       role_id: adminRole.id,
//       isActive: true,
//       subscription: 'Premium'
//     },
//     {
//       username: 'owner',
//       full_name: 'Business Owner',
//       whatsapp_number: '+6281234567892',
//       email: 'owner@microundangan.com',
//       password: await bcrypt.hash('Owner123!', saltRounds),
//       role_id: ownerRole.id,
//       isActive: true,
//       subscription: 'Premium'
//     },
//     {
//       username: 'testuser',
//       full_name: 'Test User',
//       whatsapp_number: '+6281234567893',
//       email: 'user@microundangan.com',
//       password: await bcrypt.hash('User123!', saltRounds),
//       role_id: userRole.id,
//       isActive: true,
//       subscription: 'Basic'
//     }
//   ];

//   const createdUsers = [];
//   for (const userData of usersData) {
//     const [user, created] = await User.findOrCreate({
//       where: { email: userData.email },
//       defaults: userData,
//       transaction
//     });
//     createdUsers.push(user);
//   }

//   return createdUsers;
// };

// /**
//  * Seed Categories
//  */
// const seedCategories = async (transaction) => {
//   const categoriesData = [
//     { name: 'Wedding', img_icon: null },
//     { name: 'Birthday', img_icon: null },
//     { name: 'Corporate Event', img_icon: null },
//     { name: 'Baby Shower', img_icon: null },
//     { name: 'Graduation', img_icon: null },
//     { name: 'Anniversary', img_icon: null },
//     { name: 'Religious Event', img_icon: null },
//     { name: 'Holiday Party', img_icon: null }
//   ];

//   const createdCategories = [];
//   for (const categoryData of categoriesData) {
//     const [category, created] = await Category.findOrCreate({
//       where: { name: categoryData.name },
//       defaults: categoryData,
//       transaction
//     });
//     createdCategories.push(category);
//   }

//   return createdCategories;
// };

// /**
//  * Seed Templates
//  */
// const seedTemplates = async (transaction, categories) => {
//   const templatesData = [
//     {
//       title: 'Elegant Wedding Invitation',
//       category_id: categories.find(c => c.name === 'Wedding').id,
//       description: 'Beautiful and elegant wedding invitation template with floral design'
//     },
//     {
//       title: 'Modern Wedding Card',
//       category_id: categories.find(c => c.name === 'Wedding').id,
//       description: 'Modern and minimalist wedding invitation template'
//     },
//     {
//       title: 'Kids Birthday Party',
//       category_id: categories.find(c => c.name === 'Birthday').id,
//       description: 'Fun and colorful birthday party invitation for kids'
//     },
//     {
//       title: 'Adult Birthday Celebration',
//       category_id: categories.find(c => c.name === 'Birthday').id,
//       description: 'Sophisticated birthday invitation for adults'
//     },
//     {
//       title: 'Corporate Meeting Invitation',
//       category_id: categories.find(c => c.name === 'Corporate Event').id,
//       description: 'Professional corporate event invitation template'
//     },
//     {
//       title: 'Company Annual Dinner',
//       category_id: categories.find(c => c.name === 'Corporate Event').id,
//       description: 'Elegant template for company annual dinner events'
//     },
//     {
//       title: 'Sweet Baby Shower',
//       category_id: categories.find(c => c.name === 'Baby Shower').id,
//       description: 'Cute and sweet baby shower invitation template'
//     },
//     {
//       title: 'Graduation Ceremony',
//       category_id: categories.find(c => c.name === 'Graduation').id,
//       description: 'Formal graduation ceremony invitation template'
//     }
//   ];

//   const createdTemplates = [];
//   for (const templateData of templatesData) {
//     const [template, created] = await Template.findOrCreate({
//       where: { title: templateData.title },
//       defaults: templateData,
//       transaction
//     });
//     createdTemplates.push(template);
//   }

//   return createdTemplates;
// };

// /**
//  * Seed Payments
//  */
// const seedPayments = async (transaction) => {
//   const paymentsData = [
//     {
//       name: 'Bank BCA',
//       bank_account: '1234567890',
//       qr_code: null,
//       isActive: true
//     },
//     {
//       name: 'Bank BRI',
//       bank_account: '0987654321',
//       qr_code: null,
//       isActive: true
//     },
//     {
//       name: 'Bank Mandiri',
//       bank_account: '1122334455',
//       qr_code: null,
//       isActive: true
//     },
//     {
//       name: 'GoPay',
//       bank_account: '+6281234567890',
//       qr_code: null,
//       isActive: true
//     },
//     {
//       name: 'OVO',
//       bank_account: '+6281234567890',
//       qr_code: null,
//       isActive: true
//     },
//     {
//       name: 'DANA',
//       bank_account: '+6281234567890',
//       qr_code: null,
//       isActive: true
//     }
//   ];

//   const createdPayments = [];
//   for (const paymentData of paymentsData) {
//     const [payment, created] = await Payment.findOrCreate({
//       where: { name: paymentData.name },
//       defaults: paymentData,
//       transaction
//     });
//     createdPayments.push(payment);
//   }

//   return createdPayments;
// };

// /**
//  * Seed Discounts
//  */
// const seedDiscounts = async (transaction) => {
//   const discountsData = [
//     {
//       name: 'New User Discount',
//       promo: '20%',
//       voucher: 'NEWUSER20'
//     },
//     {
//       name: 'Wedding Special',
//       promo: '15%',
//       voucher: 'WEDDING15'
//     },
//     {
//       name: 'Holiday Promotion',
//       promo: '25%',
//       voucher: 'HOLIDAY25'
//     },
//     {
//       name: 'Student Discount',
//       promo: '30%',
//       voucher: 'STUDENT30'
//     },
//     {
//       name: 'Bulk Order Discount',
//       promo: '10%',
//       voucher: 'BULK10'
//     },
//     {
//       name: 'Early Bird Special',
//       promo: '35%',
//       voucher: 'EARLYBIRD35'
//     }
//   ];

//   const createdDiscounts = [];
//   for (const discountData of discountsData) {
//     const [discount, created] = await Discount.findOrCreate({
//       where: { voucher: discountData.voucher },
//       defaults: discountData,
//       transaction
//     });
//     createdDiscounts.push(discount);
//   }

//   return createdDiscounts;
// };

// /**
//  * Seed Subscriptions
//  */
// const seedSubscriptions = async (transaction) => {
//   const subscriptionsData = [
//     {
//       name: 'Basic',
//       cost: 50000,
//       description: 'Basic plan with limited features - Up to 5 invitations per month'
//     },
//     {
//       name: 'Premium',
//       cost: 150000,
//       description: 'Premium plan with advanced features - Up to 25 invitations per month, premium templates'
//     },
//     {
//       name: 'Pro',
//       cost: 300000,
//       description: 'Professional plan for businesses - Unlimited invitations, all templates, custom branding'
//     },
//     {
//       name: 'Enterprise',
//       cost: 500000,
//       description: 'Enterprise solution - Everything in Pro plus priority support and custom features'
//     }
//   ];

//   const createdSubscriptions = [];
//   for (const subscriptionData of subscriptionsData) {
//     const [subscription, created] = await Subscription.findOrCreate({
//       where: { name: subscriptionData.name },
//       defaults: subscriptionData,
//       transaction
//     });
//     createdSubscriptions.push(subscription);
//   }

//   return createdSubscriptions;
// };

// /**
//  * Seed System Content
//  */
// const seedSystemContent = async (transaction) => {
//   const systemContentsData = [
//     {
//       key: 'app_name',
//       title: 'Application Name',
//       type: 'text',
//       content: 'Micro Undangan',
//       isActive: true
//     },
//     {
//       key: 'app_description',
//       title: 'Application Description',
//       type: 'text',
//       content: 'Digital invitation platform for all your special events',
//       isActive: true
//     },
//     {
//       key: 'contact_email',
//       title: 'Contact Email',
//       type: 'email',
//       content: 'support@microundangan.com',
//       isActive: true
//     },
//     {
//       key: 'contact_phone',
//       title: 'Contact Phone',
//       type: 'phone',
//       content: '+6281234567890',
//       isActive: true
//     },
//     {
//       key: 'company_address',
//       title: 'Company Address',
//       type: 'text',
//       content: 'Jakarta, Indonesia',
//       isActive: true
//     },
//     {
//       key: 'terms_of_service',
//       title: 'Terms of Service',
//       type: 'html',
//       content: '<h3>Terms of Service</h3><p>Please read these terms carefully before using our service.</p>',
//       isActive: true
//     },
//     {
//       key: 'privacy_policy',
//       title: 'Privacy Policy',
//       type: 'html',
//       content: '<h3>Privacy Policy</h3><p>We respect your privacy and are committed to protecting your personal data.</p>',
//       isActive: true
//     },
//     {
//       key: 'welcome_message',
//       title: 'Welcome Message',
//       type: 'text',
//       content: 'Welcome to Micro Undangan! Create beautiful digital invitations for your special events.',
//       isActive: true
//     }
//   ];

//   const createdSystemContents = [];
//   for (const systemContentData of systemContentsData) {
//     const [systemContent, created] = await SystemContent.findOrCreate({
//       where: { key: systemContentData.key },
//       defaults: systemContentData,
//       transaction
//     });
//     createdSystemContents.push(systemContent);
//   }

//   return createdSystemContents;
// };



// /**
//  * Check if database needs seeding
//  */
// export const shouldRunSeeder = async () => {
//   try {
//     // Check if admin user exists
//     const adminExists = await User.findOne({
//       where: { username: 'superadmin' }
//     });

//     // Check if basic categories exist
//     const categoriesCount = await Category.count();

//     // Run seeder if no admin exists or no categories
//     return !adminExists || categoriesCount === 0;
//   } catch (error) {
//     console.error('Error checking seeder status:', error);
//     return true; // Run seeder on error to be safe
//   }
// };

/**
 * Initialize seeder - can be called from app.js
 */
export const initializeSeeder = async () => {
  try {
    console.log('✅ Seeder initialized successfully (minimal version).');
    return {
      success: true,
      message: 'Seeder initialized but no data seeded (functions commented out)',
      skipped: true
    };
  } catch (error) {
    console.error('❌ Failed to initialize seeder:', error);
    throw error;
  }
};

// export default {
//   runAutoSeeder,
//   shouldRunSeeder,
//   initializeSeeder
// };
