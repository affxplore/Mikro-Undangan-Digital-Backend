// ========================================
// MODELS INDEX - CENTRAL ASSOCIATIONS
// ========================================
// This file imports all models and initializes their associations
// using the static associate() methods defined in each model

import db from '../config/database.js';

// Import all models
import User from './user.js';
import Role, { RoleAccessLv } from './role.js';
import AccessLv from './accessLv.js';
import Subscription from './subscription.js';
import Price from './price.js';
import Template from './template.js';
import Category from './category.js';
import Project from './project.js';
import Invitation from './invitation.js';
import Payment from './payment.js';
import Discount from './discount.js';
import Transaksi from './transaksi.js';
import TrxDetail from './trxDetail.js';
import ReceiveInv from './receive_inv.js';
import UcapanTamu from './ucapanTamu.js';
import LoginAuth from './loginAuth.js';import UserNotification from './userNotification.js';
import SystemMessage from './systemMessage.js';
import SystemContent from './systemContent.js';
import KategoriPesan from './kategori_pesan.js';
import TemplatePesan from './template_pesan.js';
import TemplateSalam from './template_salam.js';
import Afiliasi from './afiliasi.js';
import Komisi from './komisi.js';
import Example from './example.js';
// Create models object
const models = {
  User,
  Role,
  RoleAccessLv,
  AccessLv,
  Subscription,
  Price,
  Template,
  Category,
  Project,
  Invitation,
  Payment,
  Discount,
  Transaksi,
  TrxDetail,
  ReceiveInv,
  UcapanTamu,
  LoginAuth,
  UserNotification,
  SystemMessage,
  SystemContent,
  KategoriPesan,
  TemplatePesan,
  TemplateSalam,
  Afiliasi,
  Komisi,
  Example
};

// Initialize all associations
Object.keys(models).forEach((modelName) => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

// Export everything
export {
  db,
  User,
  Role,
  RoleAccessLv,
  AccessLv,
  Subscription,
  Price,
  Template,
  Category,
  Project,
  Invitation,
  Payment,
  Discount,
  Transaksi,
  TrxDetail,
  ReceiveInv,
  UcapanTamu,
  LoginAuth,
  UserNotification,
  SystemMessage,
  SystemContent,
  KategoriPesan,
  TemplatePesan,
  TemplateSalam,
  Afiliasi,
  Komisi,
  Example
};

export default models;

// import db from '../config/database.js';

// // 1. Impor semua model Anda
// import Category from './category.js';
// import Payment from './payment.js';
// import Discount from './discount.js';
// import Subscription from './subscription.js';
// import Sebar from './sebar.js';
// import SystemContent from './systemcontent.js';
// import AccessLv from './accessLv.js';
// import Role, { RoleAccessLv } from './role.js'; 
// import User from './user.js';
// import Project from './project.js';
// import Kata_ucapan from './kata_ucapan.js';
// import Template from './template.js';
// import Invitation from './invitation.js';
// import Receive_inv from './receive_inv.js';
// import LoginAuth from './loginAuth.js';
// import Transaction from './transaction.js';


// // 2. Definisikan semua relasi (asosiasi)
// // Relasi yang berasal dari Model User
// User.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });
// User.hasMany(Project, { foreignKey: 'created_by', as: 'createdProjects' });
// User.hasMany(Project, { foreignKey: 'updated_by', as: 'updatedProjects' }); // <-- TAMBAHKAN INI

// // Relasi yang berasal dari Model Role
// Role.hasMany(User, { foreignKey: 'role_id', as: 'users' });
// Role.belongsToMany(AccessLv, { through: RoleAccessLv, foreignKey: 'role_id', as: 'accessLevels' });

// // Relasi yang berasal dari Model AccessLv
// AccessLv.belongsToMany(Role, { through: RoleAccessLv, foreignKey: 'access_lv_id', as: 'roles' });

// // Relasi yang berasal dari Model Project
// Project.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
// Project.belongsTo(User, { foreignKey: 'updated_by', as: 'updater' });

// // Relasi Kata Ucapan & Sebar
// Kata_ucapan.belongsTo(Sebar, { foreignKey: 'sebar_id' });
// Sebar.hasMany(Kata_ucapan, { foreignKey: 'sebar_id' });

// // Relasi Template & Category
// Template.belongsTo(Category, { foreignKey: "category_id", as: "category" });
// Category.hasMany(Template, { foreignKey: "category_id", as: "templates" });

// // Relasi Invitation
// Invitation.belongsTo(Template, { foreignKey: 'template_id', as: 'template' });
// Invitation.belongsTo(Kata_ucapan, { foreignKey: 'kata_ucapan_id', as: 'kata_ucapan' });
// Template.hasMany(Invitation, { foreignKey: 'template_id' }); // <-- Relasi balik ditambahkan
// Kata_ucapan.hasMany(Invitation, { foreignKey: 'kata_ucapan_id' }); // <-- Relasi balik ditambahkan

// // Relasi Receive_inv & Invitation
// Receive_inv.belongsTo(Invitation, { foreignKey: 'invitation_id', as: 'invitation' });
// Invitation.hasMany(Receive_inv, { foreignKey: 'invitation_id', as: 'recipients' }); // <-- Relasi balik ditambahkan

// // Relasi LoginAuth & User
// LoginAuth.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
// User.hasMany(LoginAuth, { foreignKey: 'user_id', as: 'sessions' }); // <-- Relasi balik ditambahkan

// // Relasi Transaction
// Transaction.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
// User.hasMany(Transaction, { foreignKey: 'user_id', as: 'transactions' });

// // 3. Ekspor semua model dan koneksi database
// export {
//   db,
//   Category,
//   Payment,
//   Discount,
//   Subscription,
//   Sebar,
//   SystemContent,
//   AccessLv,
//   Role,
//   RoleAccessLv,
//   User,
//   Project,
//   Kata_ucapan,
//   Template,
//   Invitation,
//   Receive_inv,
//   LoginAuth,
//   Transaction
// };