import { Sequelize, DataTypes, Op } from "sequelize";
import db from "../config/database.js";

// ========================================
// JUNCTION TABLE
// ========================================
export const RoleAccessLv = db.define('RoleAccessLv', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    }
}, { 
    tableName: 'role_access_lvs', 
    timestamps: false 
});

// ========================================
// ROLE MODEL - PURE SCHEMA
// ========================================
const Role = db.define(
  "Role",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: {
        msg: "Nama role sudah ada.",
      },
      validate: {
        notEmpty: { msg: "Nama role tidak boleh kosong." },
        len: {
          args: [3, 50],
          msg: "Nama role harus antara 3-50 karakter."
        }
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "roles", 
    timestamps: true,
    freezeTableName: true,
    indexes: [
      { fields: ['name'], unique: true }
    ]
  }
);

// ========================================
// INSTANCE METHODS
// ========================================
Role.prototype.toJSON = function() {
  const values = { ...this.get() };
  
  // Format accessLevels jika ada
  if (values.accessLevels) {
    values.accessLevels = values.accessLevels.map(al => ({
      id: al.id,
      code: al.code,
      description: al.description
    }));
  }
  
  return values;
};

Role.prototype.hasAccessLevel = function(code) {
  if (!this.accessLevels) return false;
  return this.accessLevels.some(al => al.code === code);
};

Role.prototype.addAccessLevel = async function(accessLvId, trx) {
  const { default: AccessLv } = await import('./accessLv.js');
  const accessLevel = await AccessLv.findByPk(accessLvId);
  if (!accessLevel) throw new Error('Level akses tidak ditemukan.');
  await this.addAccessLevel(accessLevel, { transaction: trx });
};

Role.prototype.removeAccessLevel = async function(accessLvId, trx) {
  const { default: AccessLv } = await import('./accessLv.js');
  const accessLevel = await AccessLv.findByPk(accessLvId);
  if (!accessLevel) throw new Error('Level akses tidak ditemukan.');
  await this.removeAccessLevel(accessLevel, { transaction: trx });
};

// ========================================
// ASSOCIATIONS
// ========================================
Role.associate = function(models) {
  Role.belongsToMany(models.AccessLv, { 
    through: RoleAccessLv, 
    foreignKey: 'role_id', 
    as: 'accessLevels' 
  });
  
  Role.hasMany(models.User, { 
    foreignKey: 'role_id', 
    as: 'users' 
  });
};
// ========================================
// RESPONSE FORMATTER
// ========================================
export const roleResponse = (role) => {
  if (!role) return null;
  return role.toJSON ? role.toJSON() : {
    id: role.id,
    name: role.name,
    description: role.description,
    accessLevels: role.accessLevels ? role.accessLevels.map(al => ({
        id: al.id,
        code: al.code,
        description: al.description
    })) : [],
    createdAt: role.createdAt,
    updatedAt: role.updatedAt,
  };
};

// ========================================
// CRUD OPERATIONS
// ========================================

/**
 * Mengambil daftar role dengan paginasi dan pencarian.
 * @param {{page: number, limit: number}} pagination - Opsi paginasi.
 * @param {{search?: string}} filter - Opsi filter.
 */
export async function GetDataList(pagination, filter) {
  const { default: AccessLv } = await import('./accessLv.js');
  
  const limit = Number.parseInt(pagination?.limit) || 10;
  const page = Number.parseInt(pagination?.page) || 1;
  const offset = (page - 1) * limit;

  const where = {};
  if (filter?.search) {
    where.name = { [Op.like]: `%${filter.search}%` };
  }

  const { rows, count } = await Role.findAndCountAll({
    where,
    limit,
    offset,
    order: [["name", "ASC"]],
    include: {
        model: AccessLv,
        as: 'accessLevels',
        attributes: ['id', 'code', 'description'],
        through: { attributes: [] }
    },
    distinct: true,
  });

  return {
    roleList: rows,
    totalRows: count,
    totalRowsInPage: rows.length,
    currentPage: page,
    totalPages: Math.ceil(count / limit),
  };
}

/**
 * Mengambil role berdasarkan ID
 * @param {number} id - ID Role
 * @param {object} options - Opsi query tambahan
 */
export async function GetDataById(id, options = {}) {
  const { default: AccessLv } = await import('./accessLv.js');
  
  return await Role.findOne({
    where: { id },
    include: [{
      model: AccessLv,
      as: 'accessLevels',
      attributes: ['id', 'code', 'description'],
      through: { attributes: [] }
    }],
    ...options
  });
}

/**
 * Membuat role baru beserta hak aksesnya
 * @param {object} data - Data untuk role baru, termasuk `access_lv_ids`
 * @param {import("sequelize").Transaction} trx - Transaksi database
 */
export async function CreateData(data, trx) {
    const { default: AccessLv } = await import('./accessLv.js');
    const { name, description, access_lv_ids } = data;
    
    const newRole = await Role.create({ name, description }, { transaction: trx });

    if (access_lv_ids && Array.isArray(access_lv_ids) && access_lv_ids.length > 0) {
        const validAccessLevels = await AccessLv.count({ 
          where: { id: access_lv_ids },
          transaction: trx
        });
        if (validAccessLevels !== access_lv_ids.length) {
            throw new Error("Satu atau lebih ID level akses tidak valid.");
        }
        await newRole.setAccessLevels(access_lv_ids, { transaction: trx });
    }

    return await Role.findByPk(newRole.id, {
        include: { 
          model: AccessLv, 
          as: 'accessLevels', 
          through: { attributes: [] } 
        },
        transaction: trx
    });
}

/**
 * Memperbarui role berdasarkan ID
 * @param {number} id - ID Role
 * @param {object} data - Data yang akan diupdate
 * @param {import("sequelize").Transaction} trx - Transaksi database
 */
export async function UpdateData(id, data, trx) {
    const { default: AccessLv } = await import('./accessLv.js');
    
    const role = await Role.findByPk(id, { 
      transaction: trx, 
      lock: trx?.LOCK?.UPDATE 
    });
    if (!role) throw new Error("Role tidak ditemukan.");

    await role.update({ 
      name: data.name, 
      description: data.description 
    }, { transaction: trx });

    if (data.access_lv_ids && Array.isArray(data.access_lv_ids)) {
        if (data.access_lv_ids.length > 0) {
            const validAccessLevels = await AccessLv.count({ 
              where: { id: data.access_lv_ids },
              transaction: trx
            });
            if (validAccessLevels !== data.access_lv_ids.length) {
                throw new Error("Satu atau lebih ID level akses tidak valid.");
            }
        }
        await role.setAccessLevels(data.access_lv_ids, { transaction: trx });
    }
    
    return await role.reload({
        include: { 
          model: AccessLv, 
          as: 'accessLevels', 
          through: { attributes: [] } 
        },
        transaction: trx
    });
}

/**
 * Menghapus role berdasarkan ID
 * @param {import("sequelize").Transaction} trx - Transaksi database
 * @param {number} id - ID Role
 */
export async function DeleteData(trx, id) {
  const item = await Role.findOne({ 
    where: { id }, 
    transaction: trx, 
    lock: trx?.LOCK?.UPDATE 
  });
  if (!item) throw new Error('Role tidak ditemukan.');
  await item.destroy({ force: true, transaction: trx });
  return { message: 'Role berhasil dihapus.' };
}

export default Role;