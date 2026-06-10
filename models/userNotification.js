// models/userNotification.js
import { DataTypes, Op } from "sequelize";
import db from "../config/database.js";

// ========================================
// USER NOTIFICATION MODEL - PURE SCHEMA
// ========================================
const UserNotification = db.define("UserNotification", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      notNull: { msg: "User ID tidak boleh kosong." }
    }
  },
  system_message_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      notNull: { msg: "System message ID tidak boleh kosong." }
    }
  },
  is_read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
}, {
  modelName: 'User_notification',
  tableName: "user_notifications",
  timestamps: true,
  underscored: true,
  freezeTableName: true,
  indexes: [
    { fields: ['user_id'] },
    { fields: ['system_message_id'] },
    { fields: ['is_read'] }
  ]
});

// ========================================
// INSTANCE METHODS
// ========================================
UserNotification.prototype.toJSON = function() {
  const values = { ...this.get() };
  
  if (values.SystemMessage) {
    values.system_message = {
      id: values.SystemMessage.id,
      title: values.SystemMessage.title,
      content: values.SystemMessage.content,
      type: values.SystemMessage.type
    };
    delete values.SystemMessage;
  }
  
  return values;
};

UserNotification.prototype.isRead = function() {
  return this.is_read === true;
};

UserNotification.prototype.markAsRead = async function(trx) {
  this.is_read = true;
  await this.save({ transaction: trx });
};

UserNotification.prototype.markAsUnread = async function(trx) {
  this.is_read = false;
  await this.save({ transaction: trx });
};

// ========================================
// ASSOCIATIONS
// ========================================
UserNotification.associate = function(models) {
  UserNotification.belongsTo(models.User, { 
    foreignKey: "user_id", 
    as: "user" 
  });
  
  UserNotification.belongsTo(models.SystemMessage, { 
    foreignKey: "system_message_id",
    as: "systemMessage"
  });
};

// ========================================
// RESPONSE FORMATTER
// ========================================
export const userNotificationResponse = (notification) => {
  if (!notification) return null;
  return notification.toJSON ? notification.toJSON() : {
    id: notification.id,
    user_id: notification.user_id,
    system_message_id: notification.system_message_id,
    is_read: notification.is_read,
    createdAt: notification.createdAt,
    updatedAt: notification.updatedAt
  };
};

// ========================================
// CRUD OPERATIONS
// ========================================

export const GetDataList = async (pagination, filter) => {
  const { default: SystemMessage } = await import('./systemMessage.js');
  const { default: User } = await import('./user.js');
  
  const limit = Number(pagination?.limit) || 10;
  const page = Number(pagination?.page) || 1;
  const offset = (page - 1) * limit;
  
  const where = {};
  if (filter?.user_id) where.user_id = filter.user_id;
  if (filter?.is_read !== undefined) where.is_read = filter.is_read;

  const { rows, count } = await UserNotification.findAndCountAll({
    where,
    offset,
    limit,
    include: [
      { model: SystemMessage, as: 'systemMessage', attributes: ["id", "title", "content", "type"] },
      { model: User, as: 'user', attributes: ["id", "username", "email"] }
    ],
    order: [["createdAt", "DESC"]],
  });

  return { 
    userNotificationList: rows, 
    totalRows: count,
    totalRowsInPage: rows.length,
    currentPage: page,
    totalPages: Math.ceil(count / limit)
  };
};

export const GetDataById = async (id) => {
  const { default: SystemMessage } = await import('./systemMessage.js');
  
  return await UserNotification.findByPk(id, {
    include: [{ model: SystemMessage, as: 'systemMessage', attributes: ["id", "title", "content", "type"] }],
  });
};

export const CreateData = async (trx, payload) => {
  const item = await UserNotification.create(payload, { transaction: trx });
  if (!item) throw new Error('Gagal membuat notifikasi.');
  return item;
};

export const UpdateData = async (trx, id, payload) => {
  const notif = await UserNotification.findByPk(id, { transaction: trx, lock: trx?.LOCK?.UPDATE });
  if (!notif) throw new Error("Notifikasi tidak ditemukan.");
  await notif.update(payload, { transaction: trx });
  return notif;
};

export const DeleteData = async (trx, id) => {
  const notif = await UserNotification.findByPk(id, { transaction: trx, lock: trx?.LOCK?.UPDATE });
  if (!notif) throw new Error("Notifikasi tidak ditemukan.");
  await notif.destroy({ transaction: trx });
  return { message: "Notifikasi berhasil dihapus." };
};

export default UserNotification;
