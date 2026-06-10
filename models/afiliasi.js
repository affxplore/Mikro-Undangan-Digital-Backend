// models/afiliasi.js
import { DataTypes, Op } from 'sequelize';
import db from '../config/database.js';

// ========================================
// AFILIASI MODEL - PURE SCHEMA
// ========================================
const Afiliasi = db.define('Afiliasi', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  kode_afiliasi: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: { msg: "Kode afiliasi tidak boleh kosong." },
      len: {
        args: [4, 50],
        msg: "Kode afiliasi harus antara 4-50 karakter."
      }
    }
  },
  nama: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      notEmpty: { msg: "Nama tidak boleh kosong." },
      len: {
        args: [3, 200],
        msg: "Nama harus antara 3-200 karakter."
      }
    }
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      isEmail: { msg: "Format email tidak valid." }
    }
  },
  no_wa: {
    type: DataTypes.STRING(15),
    allowNull: true,
    validate: {
      len: {
        args: [10, 15],
        msg: "Nomor WA harus antara 10-15 digit."
      }
    }
  },
  metode_pembayaran: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  saldo: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
    validate: {
      min: {
        args: [0],
        msg: "Saldo tidak boleh negatif."
      }
    }
  },
  total_komisi: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
    validate: {
      min: {
        args: [0],
        msg: "Total komisi tidak boleh negatif."
      }
    }
  },
  status: {
    type: DataTypes.ENUM('aktif', 'non-aktif'),
    allowNull: false,
    defaultValue: 'aktif',
    validate: {
      isIn: {
        args: [['aktif', 'non-aktif']],
        msg: "Status harus 'aktif' atau 'non-aktif'."
      }
    }
  },
}, {
  modelName: 'Afiliasi',
  tableName: 'afiliasis',
  timestamps: true,
  paranoid: true,
  deletedAt: 'deleted_at',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  underscored: true,
  freezeTableName: true,
  indexes: [
    { unique: true, fields: ['kode_afiliasi'] },
    { fields: ['email'] },
    { fields: ['status'] }
  ]
});

// ========================================
// INSTANCE METHODS
// ========================================
Afiliasi.prototype.toJSON = function() {
  const values = { ...this.get() };
  
  // Format currency
  if (values.saldo !== undefined) {
    values.formatted_saldo = `Rp ${Number(values.saldo).toLocaleString('id-ID')}`;
  }
  if (values.total_komisi !== undefined) {
    values.formatted_total_komisi = `Rp ${Number(values.total_komisi).toLocaleString('id-ID')}`;
  }
  
  // Add komisi_list if included
  if (values.Komisis) {
    values.komisi_list = values.Komisis;
    delete values.Komisis;
  }
  
  return values;
};

Afiliasi.prototype.isActive = function() {
  return this.status === 'aktif';
};

Afiliasi.prototype.activate = async function(trx) {
  this.status = 'aktif';
  await this.save({ transaction: trx });
};

Afiliasi.prototype.deactivate = async function(trx) {
  this.status = 'non-aktif';
  await this.save({ transaction: trx });
};

Afiliasi.prototype.addSaldo = async function(amount, trx) {
  this.saldo = Number(this.saldo) + Number(amount);
  await this.save({ transaction: trx });
};

Afiliasi.prototype.withdrawSaldo = async function(amount, trx) {
  if (Number(this.saldo) < Number(amount)) {
    throw new Error('Saldo tidak mencukupi.');
  }
  this.saldo = Number(this.saldo) - Number(amount);
  await this.save({ transaction: trx });
};

Afiliasi.prototype.addKomisi = async function(amount, trx) {
  this.total_komisi = Number(this.total_komisi) + Number(amount);
  await this.save({ transaction: trx });
};

// ========================================
// ASSOCIATIONS
// ========================================
Afiliasi.associate = function(models) {
  Afiliasi.hasMany(models.Komisi, {
    foreignKey: 'afiliasi_id',
    as: 'komisis'
  });
};

// ========================================
// RESPONSE FORMATTER
// ========================================
export const afiliasiResponse = (afiliasi) => {
    if (!afiliasi) return null;
    return afiliasi.toJSON ? afiliasi.toJSON() : {
        id: afiliasi.id,
        kode_afiliasi: afiliasi.kode_afiliasi,
        nama: afiliasi.nama,
        email: afiliasi.email,
        no_wa: afiliasi.no_wa,
        metode_pembayaran: afiliasi.metode_pembayaran,
        saldo: afiliasi.saldo,
        total_komisi: afiliasi.total_komisi,
        status: afiliasi.status,
        created_at: afiliasi.created_at,
        updated_at: afiliasi.updated_at,
    };
};

// ========================================
// CRUD OPERATIONS
// ========================================

export async function GetDataList(pagination, filter) {
    const { default: Komisi } = await import('./komisi.js');
    
    const { page = 1, limit = 10 } = pagination;
    const { search } = filter;
    const offset = (page - 1) * limit;

    const where = {};
    if (search) {
        where[Op.or] = [
            { nama: { [Op.iLike]: `%${search}%` } },
            { email: { [Op.iLike]: `%${search}%` } },
            { kode_afiliasi: { [Op.iLike]: `%${search}%` } },
        ];
    }
    if (filter?.status) {
        where.status = filter.status;
    }

    const includeOptions = filter?.includeKomisi ? [
        { model: Komisi, as: 'komisis', attributes: ['id', 'jumlah', 'status'] }
    ] : [];

    const { rows, count } = await Afiliasi.findAndCountAll({
        where,
        offset,
        limit,
        include: includeOptions,
        order: [['created_at', 'DESC']],
    });
    
    return {
        data: rows,
        totalRows: count,
        totalRowsInPage: rows.length,
        currentPage: page,
        totalPages: Math.ceil(count / limit)
    };
}

export async function GetDataById(id) {
    const { default: Komisi } = await import('./komisi.js');
    
    return await Afiliasi.findByPk(id, {
        include: [{ model: Komisi, as: 'komisis' }]
    });
}

export async function GetByKode(kode_afiliasi) {
    return await Afiliasi.findOne({ where: { kode_afiliasi } });
}

export async function CreateData(data, trx) {
    const item = await Afiliasi.create(data, { transaction: trx });
    if (!item) throw new Error('Gagal membuat afiliasi.');
    return item;
}

export async function UpdateData(id, data, trx) {
    const afiliasi = await Afiliasi.findByPk(id, { transaction: trx, lock: trx?.LOCK?.UPDATE });
    if (!afiliasi) throw new Error('Afiliasi tidak ditemukan.');
    await afiliasi.update(data, { transaction: trx });
    return afiliasi;
}

export async function DeleteData(id, trx) {
    const afiliasi = await Afiliasi.findByPk(id, { transaction: trx, lock: trx?.LOCK?.UPDATE });
    if (!afiliasi) throw new Error('Afiliasi tidak ditemukan.');
    await afiliasi.destroy({ transaction: trx });
    return { message: 'Afiliasi berhasil dihapus.' };
}

export default Afiliasi;