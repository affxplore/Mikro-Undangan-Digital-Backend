// models/example.js
// NOTE: This is a template/example model for reference only
// Can be deleted if not used in production

import { DataTypes } from 'sequelize';
import db from '../config/database.js';

// ========================================
// EXAMPLE MODEL - PURE SCHEMA
// ========================================
const Example = db.define('Example', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING(200),
        allowNull: false,
        validate: {
            notEmpty: { msg: "Name tidak boleh kosong." },
            len: {
                args: [2, 200],
                msg: "Name harus antara 2-200 karakter."
            }
        }
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'examples',
    timestamps: true,
    freezeTableName: true,
});

// ========================================
// INSTANCE METHODS
// ========================================
Example.prototype.toJSON = function() {
    return { ...this.get() };
};

// ========================================
// ASSOCIATIONS
// ========================================
Example.associate = function(models) {
    // No relations
};

// ========================================
// RESPONSE FORMATTER
// ========================================
export const exampleResponse = (example) => {
    if (!example) return null;
    return example.toJSON ? example.toJSON() : {
        id: example.id,
        name: example.name,
        description: example.description,
        createdAt: example.createdAt,
        updatedAt: example.updatedAt
    };
};

// ========================================
// CRUD OPERATIONS
// ========================================

export async function GetDataList(pagination = {}, filter = {}) {
    const limit = Number.parseInt(pagination.limit, 10) || 10;
    const page = Number.parseInt(pagination.page, 10) || 1;
    const offset = (page - 1) * limit;

    const where = {};
    // Add filters here if needed

    const { rows, count } = await Example.findAndCountAll({
        where,
        limit,
        offset,
        order: [['createdAt', 'DESC']],
    });

    return {
        data: rows,
        totalRows: count,
        totalRowsInPage: rows.length,
        currentPage: page,
        totalPages: Math.ceil(count / limit),
    };
}

export async function GetDataById(id) {
    return await Example.findByPk(id);
}

export async function CreateData(data, trx) {
    const item = await Example.create(data, { transaction: trx });
    if (!item) throw new Error('Gagal membuat example.');
    return item;
}

export async function UpdateData(id, data, trx) {
    const example = await Example.findByPk(id, { transaction: trx, lock: trx?.LOCK?.UPDATE });
    if (!example) throw new Error("Example tidak ditemukan.");
    await example.update(data, { transaction: trx });
    return example;
}

export async function DeleteData(id, trx) {
    const example = await Example.findByPk(id, { transaction: trx, lock: trx?.LOCK?.UPDATE });
    if (!example) throw new Error("Example tidak ditemukan.");
    await example.destroy({ transaction: trx });
    return { message: "Example berhasil dihapus." };
}

export default Example;