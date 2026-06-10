// ========================================
// MODELS INDEX - CENTRAL ASSOCIATIONS
// ========================================
import dotenv from "dotenv";
dotenv.config();

import db from '../config/database.js';

// 1. IMPORT SEMUA (Pastikan path file .js sudah benar)
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
import LoginAuth from './loginAuth.js';
import UserNotification from './userNotification.js';
import SystemMessage from './systemMessage.js';
import SystemContent from './systemContent.js';
import KategoriPesan from './kategori_pesan.js';
import TemplatePesan from './template_pesan.js';
import TemplateSalam from './template_salam.js';
import Afiliasi from './afiliasi.js';
import Komisi from './komisi.js';
import Example from './example.js';

// 2. DEFINISIKAN OBJEK MODELS DULU
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

// 3. BARU LAKUKAN LOG DAN ASOSIASI (Setelah variabel models ada)
console.log("Models loaded:", Object.keys(models));

Object.keys(models).forEach((modelName) => {
  if (models[modelName].associate) {
    console.log(`Associating model: ${modelName}`);
    models[modelName].associate(models);
  }
});

// 4. EXPORT SEMUA
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