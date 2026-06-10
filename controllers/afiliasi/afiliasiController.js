import db from '../../config/database.js';
import {
    GetDataList,
    GetDataById,
    CreateData,
    UpdateData,
    DeleteData,
    afiliasiResponse
} from '../../models/afiliasi.js';
import { successResponse, errorResponse } from '../../helpers/response.js';
import { calculatePagination } from '../../helpers/paginate.js';

// Get all affiliates
export const getAllAfiliasi = async (req, res) => {
    try {
        const { page = 1, limit = 10, search } = req.query;
        
        const result = await GetDataList({ page, limit }, { search });
        const pagination = calculatePagination({ page, limit }, result.count);
        const data = result.rows.map(afiliasiResponse);

        successResponse(res, 200, 'success', 'Affiliates retrieved successfully', true, pagination, data);
    } catch (error) {
        errorResponse(res, 500, 'error', error.message);
    }
};

// Get affiliate by ID
export const getAfiliasiById = async (req, res) => {
    try {
        const { id } = req.params;
        const afiliasi = await GetDataById(id);

        if (!afiliasi) {
            return errorResponse(res, 404, 'error', 'Affiliate not found');
        }
        successResponse(res, 200, 'success', 'Affiliate retrieved successfully', false, null, afiliasiResponse(afiliasi));
    } catch (error) {
        errorResponse(res, 500, 'error', error.message);
    }
};

// Create new affiliate
export const createAfiliasi = async (req, res) => {
    const trx = await db.transaction();
    try {
        // Ambil data dari body + user_id dari token login
        const payload = {
            ...req.body,
            user_id: req.user.id // Pastikan kolom ini ada di database, jika tidak ada, hapus baris ini
        };

        const result = await CreateData(payload, trx);
        await trx.commit();
        
        successResponse(res, 201, 'success', 'Affiliate created successfully', false, null, afiliasiResponse(result));
    } catch (error) {
        await trx.rollback();
        // Error 400 biasanya karena duplikasi kode_afiliasi atau validasi gagal
        errorResponse(res, 400, 'error', error.message);
    }
};

// Update affiliate
export const updateAfiliasi = async (req, res) => {
    const trx = await db.transaction();
    try {
        const { id } = req.params;
        const result = await UpdateData(id, req.body, trx);
        await trx.commit();
        successResponse(res, 200, 'success', 'Affiliate updated successfully', false, null, afiliasiResponse(result));
    } catch (error) {
        await trx.rollback();
        errorResponse(res, 400, 'error', error.message);
    }
};

// Delete affiliate (soft delete)
export const deleteAfiliasi = async (req, res) => {
    const trx = await db.transaction();
    try {
        const { id } = req.params;
        await DeleteData(id, trx);
        await trx.commit();
        successResponse(res, 200, 'success', 'Affiliate deleted successfully');
    } catch (error) {
        await trx.rollback();
        errorResponse(res, 400, 'error', error.message);
    }
};