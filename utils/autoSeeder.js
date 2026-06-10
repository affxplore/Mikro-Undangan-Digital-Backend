import db from '../config/database.js';
import bcrypt from 'bcrypt';

// Import all models
import Category from '../models/category.js';
import Payment from '../models/payment.js';
import Discount from '../models/discount.js';
import Subscription from '../models/subscription.js';
import Price from '../models/price.js';
import SystemContent from '../models/systemContent.js';
import AccessLv from '../models/accessLv.js';
import Role, { RoleAccessLv } from '../models/role.js';
import User from '../models/user.js';
import Template from '../models/template.js';
import KategoriPesan from '../models/kategori_pesan.js';
import TemplatePesan from '../models/template_pesan.js';

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

    // 3. Seed Subscriptions (Moved up because Users depend on it for subscription_id)
    const subscriptions = await seedSubscriptions(transaction);
    console.log('✅ Subscriptions seeded');

    // 4. Seed Users (Admin)
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

    // 8. (Moved to step 3)
    
    // 9. Seed Prices
    const prices = await seedPrices(transaction, subscriptions);
    console.log('✅ Prices seeded');

    // 10. Seed Kategori Pesans
    const kategoriPesans = await seedKategoriPesans(transaction);
    console.log('✅ Kategori pesans seeded');

    // 11. Seed Template Pesans
    const templatePesans = await seedTemplatePesans(transaction, kategoriPesans);
    console.log('✅ Template pesans seeded');

    // 12. Seed System Content
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
        prices: prices.length,
        kategoriPesans: kategoriPesans.length,
        templatePesans: templatePesans.length,
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
  
  // Find roles
  const superAdminRole = roles.find(r => r.name === 'Super Admin');
  const adminRole = roles.find(r => r.name === 'Admin');
  const ownerRole = roles.find(r => r.name === 'Owner');
  const userRole = roles.find(r => r.name === 'User');

  const usersData = [
    {
      username: 'zakkutsu',
      full_name: 'Zakkutsu',
      whatsapp_number: '+6285155223344',
      email: 'zakkutsu@gmail.com',
      password: await bcrypt.hash('faiz123', saltRounds),
      role_id: userRole.id,
      subscription_id: 1, // Menggunakan subscription pertama (Free)
      status: 'confirmed', // Ini akan membuat isActive menjadi true secara otomatis
      isActive: true
    },
    {
      username: 'superadmin',
      full_name: 'Super Administrator',
      whatsapp_number: '+6281234567890',
      email: 'superadmin@microundangan.com',
      password: await bcrypt.hash('superadmin123', saltRounds),
      role_id: superAdminRole.id,
      status: 'confirmed' // Ini akan membuat isActive menjadi true secara otomatis
    },
    {
      username: 'admin',
      full_name: 'System Administrator',
      whatsapp_number: '+6281234567891',
      email: 'admin@microundangan.com',
      password: await bcrypt.hash('admin123', saltRounds),
      role_id: adminRole.id,
      status: 'confirmed'
    },
    {
      username: 'owner',
      full_name: 'Business Owner',
      whatsapp_number: '+6281234567892',
      email: 'owner@microundangan.com',
      password: await bcrypt.hash('owner123', saltRounds),
      role_id: ownerRole.id,
      status: 'confirmed'
    },
    {
      username: 'testuser',
      full_name: 'Test User',
      whatsapp_number: '+6281234567893',
      email: 'user@microundangan.com',
      password: await bcrypt.hash('user123', saltRounds),
      role_id: userRole.id,
      status: 'confirmed'
    }
  ];

  const createdUsers = [];
  for (const userData of usersData) {
    const [user, created] = await User.findOrCreate({
      where: { email: userData.email },
      defaults: userData,
      transaction
    });
    createdUsers.push(user);
  }

  return createdUsers;
};

/**
 * Seed Categories
 */
const seedCategories = async (transaction) => {
  const categoriesData = [
    { name: 'Pernikahan', img_icon: null },
    { name: 'Ulang Tahun', img_icon: null },
    { name: 'Aqiqah', img_icon: null },
    { name: 'Natal', img_icon: null },
    { name: 'Syukuran', img_icon: null },
    { name: 'Meeting', img_icon: null },
    { name: 'Seminar', img_icon: null },
    { name: 'Grand Opening', img_icon: null },
    { name: 'Arisan', img_icon: null },
    { name: 'Khitanan', img_icon: null },
    { name: 'Graduation', img_icon: null },
    { name: 'Party', img_icon: null }
  ];

  const createdCategories = [];
  for (const categoryData of categoriesData) {
    const [category, created] = await Category.findOrCreate({
      where: { name: categoryData.name },
      defaults: categoryData,
      transaction
    });
    createdCategories.push(category);
  }

  return createdCategories;
};

/**
 * Seed Templates
 */
const seedTemplates = async (transaction, categories) => {
  const templatesData = [
    {
      title: 'Undangan Pernikahan Elegan',
      label: 'free',
      category_id: categories.find(c => c.name === 'Pernikahan').id,
      description: 'Template undangan pernikahan yang elegan dengan desain bunga'
    },
    {
      title: 'Kartu Pernikahan Modern',
      label: 'premium',
      category_id: categories.find(c => c.name === 'Pernikahan').id,
      description: 'Template undangan pernikahan modern dan minimalis'
    },
    {
      title: 'Pesta Ulang Tahun Anak',
      label: 'free',
      category_id: categories.find(c => c.name === 'Ulang Tahun').id,
      description: 'Template undangan pesta ulang tahun yang ceria untuk anak-anak'
    },
    {
      title: 'Perayaan Ulang Tahun Dewasa',
      label: 'premium',
      category_id: categories.find(c => c.name === 'Ulang Tahun').id,
      description: 'Template undangan ulang tahun yang elegan untuk dewasa'
    },
    {
      title: 'Undangan Aqiqah',
      label: 'free',
      category_id: categories.find(c => c.name === 'Aqiqah').id,
      description: 'Template undangan aqiqah yang islami dan indah'
    },
    {
      title: 'Perayaan Natal',
      label: 'premium',
      category_id: categories.find(c => c.name === 'Natal').id,
      description: 'Template undangan perayaan Natal yang meriah'
    },
    {
      title: 'Undangan Meeting Formal',
      label: 'free',
      category_id: categories.find(c => c.name === 'Meeting').id,
      description: 'Template undangan meeting profesional dan formal'
    },
    {
      title: 'Acara Graduation',
      label: 'premium',
      category_id: categories.find(c => c.name === 'Graduation').id,
      description: 'Template undangan wisuda yang formal dan elegan'
    }
  ];

  const createdTemplates = [];
  for (const templateData of templatesData) {
    const [template, created] = await Template.findOrCreate({
      where: { title: templateData.title },
      defaults: templateData,
      transaction
    });
    createdTemplates.push(template);
  }

  return createdTemplates;
};

/**
 * Seed Payments
 */
const seedPayments = async (transaction) => {
  const paymentsData = [
    {
      name: 'Bank BCA',
      bank_account: '1234567890',
      qr_code: null,
      isActive: true
    },
    {
      name: 'Bank BRI',
      bank_account: '0987654321',
      qr_code: null,
      isActive: true
    },
    {
      name: 'Bank Mandiri',
      bank_account: '1122334455',
      qr_code: null,
      isActive: true
    },
    {
      name: 'GoPay',
      bank_account: '+6281234567890',
      qr_code: null,
      isActive: true
    },
    {
      name: 'OVO',
      bank_account: '+6281234567890',
      qr_code: null,
      isActive: true
    },
    {
      name: 'DANA',
      bank_account: '+6281234567890',
      qr_code: null,
      isActive: true
    }
  ];

  const createdPayments = [];
  for (const paymentData of paymentsData) {
    const [payment, created] = await Payment.findOrCreate({
      where: { name: paymentData.name },
      defaults: paymentData,
      transaction
    });
    createdPayments.push(payment);
  }

  return createdPayments;
};

/**
 * Seed Discounts
 */
const seedDiscounts = async (transaction) => {
  const discountsData = [
    {
      name: 'New User Discount',
      promo: '20%',
      voucher: 'NEWUSER20'
    },
    {
      name: 'Wedding Special',
      promo: '15%',
      voucher: 'WEDDING15'
    },
    {
      name: 'Holiday Promotion',
      promo: '25%',
      voucher: 'HOLIDAY25'
    },
    {
      name: 'Student Discount',
      promo: '30%',
      voucher: 'STUDENT30'
    },
    {
      name: 'Bulk Order Discount',
      promo: '10%',
      voucher: 'BULK10'
    },
    {
      name: 'Early Bird Special',
      promo: '35%',
      voucher: 'EARLYBIRD35'
    }
  ];

  const createdDiscounts = [];
  for (const discountData of discountsData) {
    const [discount, created] = await Discount.findOrCreate({
      where: { voucher: discountData.voucher },
      defaults: discountData,
      transaction
    });
    createdDiscounts.push(discount);
  }

  return createdDiscounts;
};

/**
 * Seed Subscriptions
 */
const seedSubscriptions = async (transaction) => {
  const subscriptionsData = [
    {
      slug: 'free',
      name: 'Free',
      description: 'Paket gratis untuk mencoba dengan batasan dasar.',
      invitation_limit: 1,
      allow_branding_removal: false
    },
    {
      slug: 'basic',
      name: 'Basic',
      description: 'Cocok untuk mulai membuat undangan personal.',
      invitation_limit: 20,
      allow_branding_removal: true
    },
    {
      slug: 'pro',
      name: 'Pro',
      description: 'Paling populer dengan fitur lengkap dan tanpa branding.',
      invitation_limit: 50,
      allow_branding_removal: true
    },
    {
      slug: 'business',
      name: 'Business',
      description: 'Untuk vendor dan event organizer profesional.',
      invitation_limit: 200,
      allow_branding_removal: true
    }
  ];

  const createdSubscriptions = [];
  for (const subscriptionData of subscriptionsData) {
    const [subscription, created] = await Subscription.findOrCreate({
      where: { name: subscriptionData.name },
      defaults: subscriptionData,
      transaction
    });
    createdSubscriptions.push(subscription);
  }

  return createdSubscriptions;
};

/**
 * Seed Prices
 */
const seedPrices = async (transaction, subscriptions) => {
  // Get subscription IDs by slug for easier reference
  const subscriptionMap = {};
  for (const subscription of subscriptions) {
    subscriptionMap[subscription.slug] = subscription.id;
  }

  const pricesData = [
    // Basic plan pricing
    {
      subscription_id: subscriptionMap['basic'],
      amount: 29000,
      interval: 'month'
    },
    {
      subscription_id: subscriptionMap['basic'],
      amount: 290000,
      interval: 'year'
    },
    // Pro plan pricing
    {
      subscription_id: subscriptionMap['pro'],
      amount: 59000,
      interval: 'month'
    },
    {
      subscription_id: subscriptionMap['pro'],
      amount: 590000,
      interval: 'year'
    },
    // Business plan pricing
    {
      subscription_id: subscriptionMap['business'],
      amount: 149000,
      interval: 'month'
    },
    {
      subscription_id: subscriptionMap['business'],
      amount: 1490000,
      interval: 'year'
    }
  ];

  const createdPrices = [];
  for (const priceData of pricesData) {
    const [price, created] = await Price.findOrCreate({
      where: { 
        subscription_id: priceData.subscription_id,
        interval: priceData.interval 
      },
      defaults: priceData,
      transaction
    });
    createdPrices.push(price);
  }

  return createdPrices;
};

/**
 * Seed Kategori Pesans
 */
const seedKategoriPesans = async (transaction) => {
  const kategoriPesansData = [
    { nama_kategori: 'Islami' },
    { nama_kategori: 'Kristen' },
    { nama_kategori: 'Formal' },
    { nama_kategori: 'Santai' }
  ];

  const createdKategoriPesans = [];
  for (const kategoriData of kategoriPesansData) {
    const [kategori, created] = await KategoriPesan.findOrCreate({
      where: { nama_kategori: kategoriData.nama_kategori },
      defaults: kategoriData,
      transaction
    });
    createdKategoriPesans.push(kategori);
  }

  return createdKategoriPesans;
};

/**
 * Seed Template Pesans
 */
const seedTemplatePesans = async (transaction, kategoriPesans) => {
  // Get category IDs by name for easier reference
  const kategoriMap = {};
  for (const kategori of kategoriPesans) {
    kategoriMap[kategori.nama_kategori] = kategori.id;
  }

  const templatePesansData = [
    {
      kategori_pesan_id: kategoriMap['Islami'],
      nama_template: 'Undangan Akad Islami',
      isi_pesan: "Assalamu'alaikum Wr. Wb.\nTanpa mengurangi rasa hormat, kami bermaksud mengundang Bapak/Ibu/Saudara/i {nama_tamu} untuk menghadiri acara pernikahan kami.\nInfo selengkapnya: {link_undangan}"
    },
    {
      kategori_pesan_id: kategoriMap['Formal'],
      nama_template: 'Undangan Formal Umum',
      isi_pesan: "Dengan hormat,\nMelalui pesan ini, kami mengundang Bapak/Ibu/Saudara/i {nama_tamu} untuk dapat hadir pada acara kami.\nDetail acara dapat diakses melalui tautan berikut: {link_undangan}"
    },
    {
      kategori_pesan_id: kategoriMap['Santai'],
      nama_template: 'Undangan Santai Teman',
      isi_pesan: "Woy, {nama_tamu}! Dateng ya ke acara gue. Jangan lupa bawa kado hehe.\nCek undangannya di sini: {link_undangan}"
    }
  ];

  const createdTemplatePesans = [];
  for (const templateData of templatePesansData) {
    const [template, created] = await TemplatePesan.findOrCreate({
      where: { 
        nama_template: templateData.nama_template,
        kategori_pesan_id: templateData.kategori_pesan_id 
      },
      defaults: templateData,
      transaction
    });
    createdTemplatePesans.push(template);
  }

  return createdTemplatePesans;
};

/**
 * Seed System Content
 */
const seedSystemContent = async (transaction) => {
  const systemContentsData = [
    {
      key: 'app_name',
      title: 'Application Name',
      type: 'text',
      content: 'Mikro Undangan',
      isActive: false,
      config: null,
    },
    {
      key: 'app_description',
      title: 'Application Description',
      type: 'text',
      content: 'Digital invitation platform for all your special events',
      isActive: false,
      config: null,
    },
    {
      key: 'contact_email',
      title: 'Contact Email',
      type: 'email',
      content: 'support@microundangan.com',
      isActive: false,
      config: null,
    },
    {
      key: 'contact_phone',
      title: 'Contact Phone',
      type: 'phone',
      content: '+6281234567890',
      isActive: false,
      config: null,
    },
    {
      key: 'company_address',
      title: 'Company Address',
      type: 'text',
      content: 'Jakarta, Indonesia',
      isActive: false,
      config: null,
    },
    {
      key: 'terms_of_service',
      title: 'Terms of Service',
      type: 'html',
      content: '<h3>Terms of Service</h3><p>Please read these terms carefully before using our service.</p>',
      isActive: false,
      config: null,
    },
    {
      key: 'privacy_policy',
      title: 'Privacy Policy',
      type: 'html',
      content: '<h3>Privacy Policy</h3><p>We respect your privacy and are committed to protecting your personal data.</p>',
      isActive: false,
    },
    {
      key: 'welcome_message',
      title: 'Welcome Message',
      type: 'text',
      content: 'Welcome to Micro Undangan! Create beautiful digital invitations for your special events.',
      isActive: false,
      config: null,
    },
    {
      key: 'social_facebook',
      title: 'Facebook Page URL',
      type: 'url',
      content: 'https://facebook.com/microundangan',
      isActive: false,
      config: null,
    },
    {
      key: 'social_instagram',
      title: 'Instagram Profile URL',
      type: 'url',
      content: 'https://instagram.com/microundangan',
      isActive: false,
      config: null,
    },
    {
      key: 'social_twitter',
      title: 'Twitter Profile URL',
      type: 'url',
      content: 'https://twitter.com/microundangan',
      isActive: false,
      config: null,
    },
    {
      key: 'footer_copyright',
      title: 'Footer Copyright Text',
      type: 'text',
      content: `© ${new Date().getFullYear()} Mikro Undangan. All rights reserved.`,
      isActive: false,
      config: null,
    },
    {
      key: 'analytics_google_id',
      title: 'Google Analytics ID',
      type: 'text',
      content: 'G-XXXXXXXXXX',
      isActive: false,
      config: null,
    },
    {
      key: 'logo_app',
      title: 'Logo Website',
      type: 'config',
      content: '/public/uploads/logo/mikroud_logo.png', // Path ke logo default
      isActive: true,
      config: null, // Config bisa diisi jika ada pengaturan tambahan
    }
  ];

  const createdSystemContents = [];
  for (const systemContentData of systemContentsData) {
    const [systemContent, created] = await SystemContent.findOrCreate({
      where: { key: systemContentData.key },
      defaults: systemContentData,
      transaction
    });
    createdSystemContents.push(systemContent);
  }

  return createdSystemContents;
};

/**
 * Check if database needs seeding
 */
export const shouldRunSeeder = async () => {
  try {
    // Check if admin user exists
    const adminExists = await User.findOne({
      where: { username: 'superadmin' }
    });

    // Check if basic categories exist
    const categoriesCount = await Category.count();

    // Run seeder if no admin exists or no categories
    return !adminExists || categoriesCount === 0;
  } catch (error) {
    console.error('Error checking seeder status:', error);
    return true; // Run seeder on error to be safe
  }
};

/**
 * Initialize seeder - can be called from app.js
 */
export const initializeSeeder = async () => {
  try {
    console.log('🌱 Checking if seeding is needed...');
    
    const needsSeeding = await shouldRunSeeder();
    
    if (!needsSeeding) {
      console.log('✅ Database already contains initial data - skipping seeder.');
      return {
        success: true,
        message: 'Database already seeded',
        skipped: true
      };
    }

    console.log('🚀 Running database seeder...');
    return await runAutoSeeder();
  } catch (error) {
    console.error('❌ Failed to initialize seeder:', error);
    throw error;
  }
};

export default {
  runAutoSeeder,
  shouldRunSeeder,
  initializeSeeder
};