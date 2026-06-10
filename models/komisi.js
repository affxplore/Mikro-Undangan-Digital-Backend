// models/komisi.js
import { DataTypes, Op } from 'sequelize';
import db from '../config/database.js';

// ========================================
// KOMISI MODEL - PURE SCHEMA
// ========================================
const Komisi = db.define('Komisi', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  afiliasi_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      notNull: { msg: "Afiliasi ID tidak boleh kosong." }
    }
  },
  transaksi_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      notNull: { msg: "Transaksi ID tidak boleh kosong." }
    }
  },
  jumlah: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      notNull: { msg: "Jumlah tidak boleh kosong." },
      min: {
        args: [0],
        msg: "Jumlah harus positif."
      }
    }
  },
  status: {
    type: DataTypes.ENUM('pending', 'dibayar', 'gagal'),
    allowNull: false,
    defaultValue: 'pending',
    validate: {
      isIn: {
        args: [['pending', 'dibayar', 'gagal']],
        msg: "Status harus: pending, dibayar, atau gagal."
      }
    }
  },
}, {
  modelName: 'Komisi',
  tableName: 'komisis',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  underscored: true,
  freezeTableName: true,
  indexes: [
    { fields: ['afiliasi_id'] },
    { fields: ['transaksi_id'] },
    { fields: ['status'] }
  ]
});

// ========================================
// INSTANCE METHODS
// ========================================
Komisi.prototype.toJSON = function() {
  const values = { ...this.get() };
  
  // Format currency
  if (values.jumlah !== undefined) {
    values.formatted_jumlah = `Rp ${Number(values.jumlah).toLocaleString('id-ID')}`;
  }
  
  // Transform associations
  if (values.Afiliasi) {
    values.afiliasi = {
      id: values.Afiliasi.id,
      kode_afiliasi: values.Afiliasi.kode_afiliasi,
      nama: values.Afiliasi.nama
    };
    delete values.Afiliasi;
  }
  
  if (values.Transaksi) {
    values.transaksi = {
      id: values.Transaksi.id,
      no_trx: values.Transaksi.no_trx,
      total_amount: values.Transaksi.total_amount
    };
    delete values.Transaksi;
  }
  
  return values;
};

Komisi.prototype.isPending = function() {
  return this.status === 'pending';
};

Komisi.prototype.isDibayar = function() {
  return this.status === 'dibayar';
};

Komisi.prototype.isGagal = function() {
  return this.status === 'gagal';
};

Komisi.prototype.markAsDibayar = async function(trx) {
  this.status = 'dibayar';
  await this.save({ transaction: trx });
};

Komisi.prototype.markAsGagal = async function(trx) {
  this.status = 'gagal';
  await this.save({ transaction: trx });
};

// ========================================
// ASSOCIATIONS
// ========================================
Komisi.associate = function(models) {
  Komisi.belongsTo(models.Afiliasi, { 
    foreignKey: 'afiliasi_id', 
    as: 'afiliasi' 
  });
  
  Komisi.belongsTo(models.Transaksi, { 
    foreignKey: 'transaksi_id', 
    as: 'transaksi' 
  });
};

// ========================================
// RESPONSE FORMATTER
// ========================================
export const komisiResponse = (komisi) => {
    if (!komisi) return null;
    return komisi.toJSON ? komisi.toJSON() : {
        id: komisi.id,
        afiliasi_id: komisi.afiliasi_id,
        transaksi_id: komisi.transaksi_id,
        jumlah: komisi.jumlah,
        status: komisi.status,
        created_at: komisi.created_at,
        updated_at: komisi.updated_at,
        afiliasi: komisi.afiliasi,
        transaksi: komisi.transaksi,
    };
};

// ========================================
// CRUD OPERATIONS
// ========================================

export async function GetDataList(pagination, filter) {
    const { default: Afiliasi } = await import('./afiliasi.js');
    const { default: Transaksi } = await import('./transaksi.js');
    
    const { page = 1, limit = 10 } = pagination;
    const { search, afiliasi_id, transaksi_id, status } = filter;
    const offset = (page - 1) * limit;

    const where = {};
    if (afiliasi_id) where.afiliasi_id = afiliasi_id;
    if (transaksi_id) where.transaksi_id = transaksi_id;
    if (status) where.status = status;
    if (search) {
        where.status = { [Op.iLike]: `%${search}%` };
    }

    const includeOptions = [
        { model: Afiliasi, as: 'afiliasi', attributes: ['id', 'kode_afiliasi', 'nama', 'email'] },
        { model: Transaksi, as: 'transaksi', attributes: ['id', 'no_trx', 'total_amount', 'status'] }
    ];

    const { rows, count } = await Komisi.findAndCountAll({
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
    const { default: Afiliasi } = await import('./afiliasi.js');
    const { default: Transaksi } = await import('./transaksi.js');
    
    return await Komisi.findByPk(id, {
        include: [
            { model: Afiliasi, as: 'afiliasi' },
            { model: Transaksi, as: 'transaksi' }
        ],
    });
}

export async function GetByAfiliasiId(afiliasi_id) {
    const { default: Transaksi } = await import('./transaksi.js');
    
    return await Komisi.findAll({ 
        where: { afiliasi_id },
        include: [{ model: Transaksi, as: 'transaksi' }],
        order: [['created_at', 'DESC']]
    });
}

export async function GetByTransaksiId(transaksi_id) {
    const { default: Afiliasi } = await import('./afiliasi.js');
    
    return await Komisi.findAll({ 
        where: { transaksi_id },
        include: [{ model: Afiliasi, as: 'afiliasi' }],
        order: [['created_at', 'DESC']]
    });
}

export async function CreateData(data, trx) {
    const item = await Komisi.create(data, { transaction: trx });
    if (!item) throw new Error('Gagal membuat komisi.');
    return item;
}

export async function UpdateData(id, data, trx) {
    const komisi = await Komisi.findByPk(id, { transaction: trx, lock: trx?.LOCK?.UPDATE });
    if (!komisi) throw new Error('Komisi tidak ditemukan.');
    await komisi.update(data, { transaction: trx });
    return komisi;
}

export async function DeleteData(id, trx) {
    const komisi = await Komisi.findByPk(id, { transaction: trx, lock: trx?.LOCK?.UPDATE });
    if (!komisi) throw new Error('Komisi tidak ditemukan.');
    await komisi.destroy({ transaction: trx });
    return { message: 'Komisi berhasil dihapus.' };
}

export default Komisi;