/**
 * ================================================================================
 * USER MODEL - Pure Schema Definition
 * ================================================================================
 * Model hanya berisi definisi schema, validasi, hooks, dan instance methods.
 * Relasi didefinisikan di models/index.js untuk menghindari circular dependency.
 * CRUD operations ada di bagian bawah file untuk backward compatibility.
 * ================================================================================
 */

import { DataTypes, Op } from "sequelize";
import db from "../config/database.js";
import { buildPublicUrl } from "../helpers/files.js";

// ================================================================================
// MODEL DEFINITION
// ================================================================================

const User = db.define("User", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: {
      name: 'users_username_unique',
      msg: 'Username sudah digunakan'
    },
    validate: {
      len: {
        args: [3, 50],
        msg: 'Username harus 3-50 karakter'
      },
      isAlphanumeric: {
        msg: 'Username hanya boleh huruf dan angka'
      },
    },
  },
  full_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Nama lengkap tidak boleh kosong'
      },
      len: {
        args: [2, 100],
        msg: 'Nama lengkap harus 2-100 karakter'
      },
    },
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: {
      name: 'users_email_unique',
      msg: 'Email sudah terdaftar'
    },
    validate: {
      isEmail: {
        msg: 'Format email tidak valid'
      },
    },
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Nullable untuk user OAuth'
  },
  whatsapp_number: {
    type: DataTypes.STRING(20),
    allowNull: true,
    validate: {
      isNumeric: {
        msg: 'Nomor WhatsApp hanya boleh angka'
      },
    },
  },
  profilePicture: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Relative path dari public folder'
  },
  role_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 3, // Default role User
  },
  subscription_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 1, // Default Free subscription
  },
  status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'banned'),
    allowNull: false,
    defaultValue: 'pending',
    validate: {
      isIn: {
        args: [['pending', 'confirmed', 'banned']],
        msg: 'Status harus pending, confirmed, atau banned'
      },
    },
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Auto-sync dengan status field'
  },
  otp: {
    type: DataTypes.STRING(6),
    allowNull: true,
  },
  subscription_expires_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  resetPasswordToken: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  resetPasswordExpires: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  googleId: {
    type: DataTypes.STRING(100),
    // field: 'google_id' tidak perlu ditulis manual karena underscored: true
    // sudah otomatis memetakan googleId → google_id di database.
    allowNull: true,
    unique: {
      name: 'users_google_id_unique',
      msg: 'Google account sudah terhubung'
    },
  },
}, {
  modelName: 'User',
  tableName: "users",
  underscored: true,
  timestamps: true,
  freezeTableName: true,
  hooks: {
    beforeSave: (user) => {
      // Auto-sync isActive dengan status
      // Gunakan setDataValue agar Sequelize benar-benar me-track perubahan ini
      user.setDataValue('isActive', user.status === 'confirmed');
    },
  },
  indexes: [
    { fields: ['email'] },
    { fields: ['username'] },
    { fields: ['role_id'] },
    { fields: ['subscription_id'] },
    { fields: ['google_id'] },
    { fields: ['status'] },
  ],
});

// ================================================================================
// INSTANCE METHODS (Methods untuk 1 user instance)
// ================================================================================

/**
 * Override toJSON untuk exclude sensitive fields
 */
User.prototype.toJSON = function() {
  const values = { ...this.get() };
  delete values.password;
  delete values.otp;
  delete values.resetPasswordToken;
  delete values.resetPasswordExpires;
  return values;
};

/**
 * Check apakah user punya role tertentu
 */
User.prototype.hasRole = function(roleName) {
  return this.role?.name === roleName;
};

/**
 * Check apakah subscription masih aktif
 */
User.prototype.isSubscriptionActive = function() {
  if (!this.subscription_expires_at) return false;
  return new Date() < new Date(this.subscription_expires_at);
};

// ================================================================================
// STATIC/CLASS METHODS (Relasi didefinisikan di models/index.js)
// ================================================================================

User.associate = function(models) {
  User.belongsTo(models.Role, { 
    foreignKey: 'role_id', 
    as: 'role' 
  });
  User.belongsTo(models.Subscription, { 
    foreignKey: 'subscription_id', 
    as: 'subscription' 
  });
  User.hasMany(models.Project, { 
    foreignKey: 'created_by', 
    as: 'projects' 
  });
};


// ================================================================================
// RESPONSE FORMATTER (untuk backward compatibility)
// ================================================================================

/**
 * Format user data untuk API response
 * @param {User} user - Sequelize user instance
 * @returns {Object} Formatted user data
 */
export const userResponse = (user) => {
  if (!user) return null;

  return {
    id: user.id,
    username: user.username,
    full_name: user.full_name,
    whatsapp_number: user.whatsapp_number,
    email: user.email,
    role_id: user.role_id,
    profilePicture: user.profilePicture ? buildPublicUrl(user.profilePicture) : null,
    isActive: user.isActive,
    status: user.status,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    role: user.role ? {
      id: user.role.id,
      name: user.role.name,
    } : null,
    subscription: user.subscription ? {
      id: user.subscription.id,
      slug: user.subscription.slug,
      name: user.subscription.name,
      invitation_limit: user.subscription.invitation_limit,
      allow_branding_removal: user.subscription.allow_branding_removal,
    } : null,
  };
};

// ================================================================================
// CRUD OPERATIONS (untuk backward compatibility dengan controller existing)
// ================================================================================

/**
 * Get user list with pagination and filters
 */
export async function GetDataList(pagination = {}, filter = {}) {
  // Lazy load models to avoid circular dependency
  const Role = (await import('./role.js')).default;
  const Subscription = (await import('./subscription.js')).default;

  const limit = parseInt(pagination?.limit) || 10;
  const page = parseInt(pagination?.page) || 1;
  const offset = (page - 1) * limit;

  const where = {};

  // Role filter
  if (filter?.role_id) {
    where.role_id = filter.role_id;
  } else if (filter?.exclude_role_id) {
    where.role_id = { [Op.ne]: filter.exclude_role_id };
  }

  // Search filter
  if (filter?.search) {
    const q = String(filter.search).trim();
    where[Op.or] = [
      { full_name: { [Op.iLike]: `%${q}%` } },
      { username: { [Op.iLike]: `%${q}%` } },
      { email: { [Op.iLike]: `%${q}%` } },
    ];
  }

  // Status filter
  if (filter?.status === "true") {
    where.isActive = true;
  } else if (filter?.status === "false") {
    where.isActive = false;
  }

  // Include associations
  const include = [
    {
      model: Role,
      as: 'role',
      attributes: ['id', 'name'],
      ...(filter?.role && { where: { name: filter.role } }),
    },
    {
      model: Subscription,
      as: 'subscription',
      attributes: ['id', 'slug', 'name', 'invitation_limit', 'allow_branding_removal'],
      required: false,
    }
  ];

  // Sorting
  const ALLOWED_SORT_FIELDS = ['id', 'username', 'full_name', 'email', 'createdAt', 'updatedAt'];
  let order = [['createdAt', 'DESC']];

  if (pagination?.sort) {
    const [field, direction = 'ASC'] = pagination.sort.split(':');
    if (ALLOWED_SORT_FIELDS.includes(field)) {
      order = [[field, direction.toUpperCase() === 'DESC' ? 'DESC' : 'ASC']];
    }
  }

  const { rows, count } = await User.findAndCountAll({
    where,
    include,
    limit,
    offset,
    order,
    distinct: true,
  });

  return {
    userList: rows,
    totalRows: count,
  };
}
/**
 * Get user by ID with associations
 */
export async function GetDataById(id, options = {}) {
  const Role = (await import('./role.js')).default;
  const Subscription = (await import('./subscription.js')).default;

  return await User.findOne({
    where: { id },
    include: [
      {
        model: Role,
        as: 'role',
        attributes: ['id', 'name'],
      },
      {
        model: Subscription,
        as: 'subscription',
        attributes: ['id', 'slug', 'name', 'invitation_limit', 'allow_branding_removal'],
        required: false,
      }
    ],
    ...options
  });
}

/**
 * Create new user
 */
export async function CreateData(trx, data) {
  const user = await User.create(data, { transaction: trx });
  if (!user) throw new Error('User creation failed');
  return user;
}

/**
 * Update user data
 */
export async function UpdateData(trx, id, data) {
  const user = await User.findByPk(id, {
    transaction: trx,
    lock: trx?.LOCK?.UPDATE
  });
  
  if (!user) throw new Error('User not found');
  
  await user.update(data, { transaction: trx });
  return user;
}

/**
 * Delete user
 */
export async function DeleteData(trx, id) {
  const user = await User.findByPk(id,{
    transaction: trx,
    lock: trx?.LOCK?.UPDATE
  });
  
  if (!user) throw new Error('User tidak ditemukan');
  
  const deletedProfilePicture = user.profilePicture;
  await user.destroy({ force: true, transaction: trx });
  
  return {
    message: 'User berhasil dihapus',
    deletedProfilePicture
  };
}

// ================================================================================
// DEFAULT EXPORT
// ================================================================================

/**
 * Menghapus user berdasarkan ID
 * @param {import("sequelize").Transaction} trx - Transaksi database
 * @param {number} id - ID User
 */
export async function DeleteDataForce(trx, id) {
  const item = await User.findOne({ 
    where: { id }, 
    transaction: trx, 
    lock: trx?.LOCK?.UPDATE });

  if (!item) throw new Error('User tidak ditemukan.');
  await item.destroy({ force: true, transaction: trx });
  return { message: 'User berhasil dihapus.' };
}

export default User;

// export {
//   // GetDataList,
//   // GetDataById,
//   // CreateData,
//   // UpdateData,
//   // DeleteDataSoft,
//   // DeleteDataForce,
//   // UpdateProfilePicture,
// };
