import { DataTypes } from "sequelize";
import db from "../config/database.js";

// ========================================
// LOGIN AUTH MODEL - PURE SCHEMA
// ========================================
const LoginAuth = db.define(
  "LoginAuth",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    uuid: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      unique: true,
      validate: {
        isUUID: 4
      }
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notNull: { msg: "User ID tidak boleh kosong." }
      }
    },
    expired_at: {
      type: DataTypes.BIGINT,
      allowNull: false,
      validate: {
        notNull: { msg: "Expired at tidak boleh kosong." }
      },
      comment: "Unix timestamp dalam milidetik"
    }
  },
  {
    tableName: "login_auths",
    timestamps: true,
    indexes: [
      { fields: ['uuid'], unique: true },
      { fields: ['user_id'] },
      { fields: ['expired_at'] }
    ]
  }
);

// ========================================
// INSTANCE METHODS
// ========================================
LoginAuth.prototype.toJSON = function() {
  return { ...this.get() };
};

LoginAuth.prototype.isExpired = function() {
  return Date.now() > this.expired_at;
};

LoginAuth.prototype.getRemainingTime = function() {
  return Math.max(0, this.expired_at - Date.now());
};

LoginAuth.prototype.extendExpiry = async function(milliseconds, trx) {
  this.expired_at = Date.now() + milliseconds;
  await this.save({ transaction: trx });
};

// ========================================
// ASSOCIATIONS
// ========================================
LoginAuth.associate = function(models) {
  LoginAuth.belongsTo(models.User, { 
    foreignKey: 'user_id', 
    as: 'user' 
  });
};

export default LoginAuth;