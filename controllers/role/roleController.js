import db from "../../config/database.js";
import Role, {
  roleResponse,
  CreateData,
  DeleteData,
  GetDataList,
  GetDataById,
  UpdateData,
} from "../../models/role.js";
import AccessLv from "../../models/accessLv.js";
import { successResponse, errorResponse } from "../../helpers/response.js";
import { calculatePagination } from "../../helpers/paginate.js";
import { Sequelize } from "sequelize";

// GET /roles -> Mengambil semua role dengan paginasi
// export const getAllRoles = async (req, res) => {
//   try {
//     const { page = 1, limit = 10, search } = req.query;
//     const result = await GetDataList({ page, limit }, { search });
//     const pagination = calculatePagination({ page, limit }, result.totalRows);
//     const data = result.data.map(roleResponse);

//     successResponse(res, 200, "Role berhasil diambil", true, pagination, data);
//   } catch (error) {
//     errorResponse(res, 500, "Internal Server Error", error.message);
//   }
// };
export const getAllRoles = async (req, res) => {
  try {
    const { page = 1, limit = 10, sort, filter } = req.query;

    // filter bisa dikirim sebagai JSON string di query
    let parsedFilter = {};
    if (typeof filter === 'string') {
      try { parsedFilter = JSON.parse(filter); } catch { parsedFilter = {}; }
    } else if (typeof filter === 'object' && filter !== null) {
      parsedFilter = filter;
    }

    const pagination = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sort: typeof sort === 'string' ? sort : undefined
    };

    const result = await GetDataList(pagination, parsedFilter);
    const paginationData = calculatePagination(pagination, result.totalRows);

    // Map profilePicture (relative) -> public URL
    const withUrls = result.roleList.map(t => {
      const plainRole = t.get({ plain: true });
      return {
        ...plainRole,
      };
    });

    successResponse(
      res,
      200,
      'success',
      'Roles retrieved successfully',
      true,
      paginationData,
      withUrls
    );
  } catch (error) {
    errorResponse(
      res,
      400,
      'error',
      error.message || 'Failed to retrieve roles',
      false,
      null,
      null
    );
  }
};


// GET /roles/:id -> Mengambil satu role berdasarkan ID
// export const getRoleById = async (req, res) => {
//   try {
//     const role = await Role.findByPk(req.params.id, {
//         include: {
//             model: AccessLv,
//             as: 'accessLevels',
//             attributes: ['id', 'code', 'description'],
//             through: { attributes: [] }
//         }
//     });
//     if (!role) {
//       return errorResponse(res, 404, "Not Found", "Role tidak ditemukan.");
//     }
//     successResponse(res, 200, "Role berhasil ditemukan", false, null, roleResponse(role));
//   } catch (error) {
//     errorResponse(res, 500, "Internal Server Error", error.message);
//   }
// };
export const getRoleById = async (req, res) => {
  try {
    const { id } = req.params;
    const role = await GetDataById(id);

    if (!role) {
      return errorResponse(res, 404, 'error', 'Role not found', false, null, null);
    }

    const payload = {
      ...role.get({ plain: true }),
    };
    successResponse(res, 200, 'success', 'Role retrieved successfully', false, null, payload);
  } catch (error) {
    errorResponse(res, 400, 'error', error.message, false, null, null);
  }
};


// POST /roles -> Membuat role baru
export const createRole = async (req, res) => {
  const trx = await db.transaction();
  try {
    const { name, description, access_lv_ids } = req.body;
    if (!name) {
      throw new Error("Nama role wajib diisi.");
    }

    const payload = { name, description, access_lv_ids };
    const newRole = await CreateData(payload, trx);
    await trx.commit();

    successResponse(res, 201, "success", "Role berhasil dibuat", false, null, roleResponse(newRole));
  } catch (error) {
    await trx.rollback();
    if (error instanceof Sequelize.UniqueConstraintError) {
      return errorResponse(res, 409, "Conflict", "Nama role sudah ada.");
    }
    errorResponse(res, 400, "error", "Bad Request", error.message);
  }
};

// PUT /roles/:id -> Memperbarui role
export const updateRole = async (req, res) => {
  const trx = await db.transaction();
  try {
    const { id } = req.params;
    const { name, description, access_lv_ids } = req.body;
    
    const payload = { name, description, access_lv_ids };
    if (Object.keys(payload).length === 0) {
      throw new Error("Tidak ada data yang diubah.");
    }

    const updatedRole = await UpdateData(id, payload, trx);
    await trx.commit();

    successResponse(res, 200, "success", "Role berhasil diperbarui", false, null, roleResponse(updatedRole));
  } catch (error) {
    await trx.rollback();
    if (error instanceof Sequelize.UniqueConstraintError) {
      return errorResponse(res, 409, "Conflict", "Nama role sudah ada.");
    }
    errorResponse(res, 400, "error", "Bad Request", error.message);
  }
};

// DELETE /roles/:id -> Menghapus role
// export const deleteRole = async (req, res) => {
//   const trx = await db.transaction();
//   try {
//     const { id } = req.params;
//     await DeleteData(id, trx);
//     await trx.commit();

//     successResponse(res, 200, "success", "Role berhasil dihapus");
//   } catch (error) {
//     await trx.rollback();
//     errorResponse(res, 400, "error", "Bad Request", error.message, false, null, null);
//   }
// };

export const deleteRole = async (req, res) => {
  const { id } = req.params;
  const trx = await db.transaction();

  try {
    const role = await Role.findOne({
      where: { id },
      transaction: trx,
      lock: true,
    });

    if (!role) {
      throw new Error("Role not found");
    }

    await role.destroy({ transaction: trx, force: true });
    await trx.commit();

  } catch (error) {
    await trx.rollback();
    return errorResponse(res, 400, "error", error.message);
  }

  // Kirim respons sukses di luar blok try...catch
  return successResponse(
    res,
    200,                          // -> meta.code
    "success",                    // -> meta.status
    "Role berhasil dihapus",      // -> meta.message (bisa diganti "")
    false,                         // -> meta.isPaginated
    null,                         // -> pagination
    null                          // -> data
  );
};


export const getAllAccessLevels = async (req, res) => {
  try {
    const accessLevels = await AccessLv.findAll({ order: [['id', 'ASC']] });
    successResponse(res, 200, "success", "Access levels retrieved successfully", false, null, accessLevels);
  } catch (error) {
    errorResponse(res, 500, "Internal Server Error", error.message);
  }
};