import { DataTypes } from "sequelize";
import db from "../config/database.js";

// ========================================
// ACCESS LEVEL MODEL - PURE SCHEMA
// ========================================
const AccessLv = db.define(
  "AccessLv",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: {
        msg: "Kode access level sudah ada."
      },
      validate: {
        notEmpty: { msg: "Kode tidak boleh kosong." },
        isUppercase: { msg: "Kode harus huruf besar." }
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "access_lvs",
    timestamps: false,
    freezeTableName: true,
    indexes: [
      { fields: ['code'], unique: true }
    ]
  }
);

// ========================================
// INSTANCE METHODS
// ========================================
AccessLv.prototype.toJSON = function() {
  return { ...this.get() };
};

// ========================================
// ASSOCIATIONS
// ========================================
AccessLv.associate = function(models) {
  AccessLv.belongsToMany(models.Role, { 
    through: models.RoleAccessLv, 
    foreignKey: 'access_lv_id', 
    as: 'roles' 
  });
};

export default AccessLv;