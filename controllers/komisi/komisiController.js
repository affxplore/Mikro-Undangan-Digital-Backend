import db from '../../config/database.js';
import {
    GetDataList,
    GetDataById,
    CreateData,
    UpdateData,
    DeleteData,
    komisiResponse
} from '../../models/komisi.js';
import { successResponse, errorResponse } from '../../helpers/response.js';
import { calculatePagination } from '../../helpers/paginate.js';

// Get all commissions
export const getAllKomisi = async (req, res) => {
    try {
        const { page = 1, limit = 10, search, afiliasi_id, transaksi_id } = req.query;
        
        const result = await GetDataList({ page, limit }, { search, afiliasi_id, transaksi_id });
        const pagination = calculatePagination({ page, limit }, result.count);
        const data = result.rows.map(komisiResponse);

        successResponse(res, 200, 'success', 'Commissions retrieved successfully', true, pagination, data);
    } catch (error) {
        errorResponse(res, 500, 'error', error.message);
    }
};

// Get commission by ID
export const getKomisiById = async (req, res) => {
    try {
        const { id } = req.params;
        const komisi = await GetDataById(id);

        if (!komisi) {
            return errorResponse(res, 404, 'error', 'Commission not found');
        }
        successResponse(res, 200, 'success', 'Commission retrieved successfully', false, null, komisiResponse(komisi));
    } catch (error) {
        errorResponse(res, 500, 'error', error.message);
    }
};

// Create new commission
export const createKomisi = async (req, res) => {
    const trx = await db.transaction();
    try {
        const result = await CreateData(req.body, trx);
        await trx.commit();
        successResponse(res, 201, 'success', 'Commission created successfully', false, null, komisiResponse(result));
    } catch (error) {
        await trx.rollback();
        errorResponse(res, 400, 'error', error.message);
    }
};

// Update commission
export const updateKomisi = async (req, res) => {
    const trx = await db.transaction();
    try {
        const { id } = req.params;
        const result = await UpdateData(id, req.body, trx);
        await trx.commit();
        successResponse(res, 200, 'success', 'Commission updated successfully', false, null, komisiResponse(result));
    } catch (error) {
        await trx.rollback();
        errorResponse(res, 400, 'error', error.message);
    }
};

// Delete commission
export const deleteKomisi = async (req, res) => {
    const trx = await db.transaction();
    try {
        const { id } = req.params;
        await DeleteData(id, trx);
        await trx.commit();
        successResponse(res, 200, 'success', 'Commission deleted successfully');
    } catch (error) {
        await trx.rollback();
        errorResponse(res, 400, 'error', error.message);
    }
};