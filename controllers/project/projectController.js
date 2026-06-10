// import db from "../../config/database.js";
// import {
//   projectResponse,
//   CreateData,
//   DeleteData,
//   GetDataList,
//   UpdateData,
// } from "../../models/project.js";
// import Template from "../../models/template.js"; // <-- Impor Template untuk validasi
// import { successResponse, errorResponse } from "../../helpers/response.js";
// import { calculatePagination } from "../../helpers/paginate.js";

// export const getAllProjects = async (req, res) => {
//   try {
//     const { page = 1, limit = 10, search } = req.query;
//     const { id: userId, role: userRole } = req.user; // Ambil data user dari token

//     const filter = { search };

//     // Jika user BUKAN Admin atau Owner, filter proyek berdasarkan ID mereka
//     if (userRole !== 'Admin' && userRole !== 'Owner') {
//       filter.created_by = userId;
//     }

//     const result = await GetDataList({ page, limit }, filter);
//     const pagination = calculatePagination({ page, limit }, result.totalRows);
//     const data = result.data.map(projectResponse);

//     successResponse(res, 200, "success", "Proyek berhasil diambil", true, pagination, data);
//   } catch (error) {
//     errorResponse(res, 500, "error", error.message);
//   }
// };


// export const getProjectById = async (req, res) => {
//   try {
//         const project = await GetDataById(req.params.id); // GetDataById sudah punya include yang benar
    
//     if (!project) {
//       console.log(`[BACKEND] Gagal: Project dengan ID ${req.params.id} tidak ditemukan.`);
//       return errorResponse(res, 404, "error", "Proyek tidak ditemukan.");
//     }

//     console.log(`[BACKEND] Sukses: Project dengan ID ${req.params.id} ditemukan.`);
//     successResponse(res, 200, "success", "Proyek berhasil ditemukan", false, null, projectResponse(project));
//   } catch (error) {
//     // --- INI LOG YANG PALING PENTING ---
//     console.error(`[BACKEND] ERROR di getProjectById:`, error);
//     errorResponse(res, 500, "error", error.message);
//   }
// };


// export const createProject = async (req, res) => {
//   const trx = await db.transaction();
//   try {
//     const { project_data, template_id } = req.body;
//     const userId = req.user.id;

//     if (!project_data || !template_id) {
//       throw new Error("Data proyek (project_data) dan template_id wajib diisi.");
//     }
    
//     // --- PENAMBAHAN VALIDASI ---
//     const templateExists = await Template.findByPk(template_id);
//     if (!templateExists) {
//         await trx.rollback();
//         return errorResponse(res, 404, "error", `Template dengan ID ${template_id} tidak ditemukan.`);
//     }

//     const payload = {
//       project_data:
//         typeof project_data === "object"
//           ? JSON.stringify(project_data)
//           : project_data,
//       template_id: template_id,
//       created_by: userId,
//       updated_by: userId,
//     };

//     const newProject = await CreateData(payload, trx);
//     await trx.commit();

//     successResponse(
//       res,
//       201,
//       "success",
//       "Proyek berhasil dibuat",
//       false,
//       null,
//       projectResponse(newProject)
//     );
//   } catch (error) {
//     await trx.rollback();
//     errorResponse(res, 400, "error", error.message);
//   }
// };

// export const updateProject = async (req, res) => {
//   const trx = await db.transaction();
//   try {
//     const { id } = req.params;
//     const { project_data, template_id } = req.body;
//     const userId = req.user.id;

//     const payload = { updated_by: userId };

//     if (project_data) {
//       payload.project_data = typeof project_data === "object" ? JSON.stringify(project_data) : project_data;
//     }
    
//     if (template_id) {
//         // --- PENAMBAHAN VALIDASI ---
//         const templateExists = await Template.findByPk(template_id);
//         if (!templateExists) {
//             await trx.rollback();
//             return errorResponse(res, 404, "error", `Template dengan ID ${template_id} tidak ditemukan.`);
//         }
//         payload.template_id = template_id;
//     }

//     if (Object.keys(payload).length <= 1 && !project_data && !template_id) {
//       throw new Error("Tidak ada data yang diubah.");
//     }

//     const updatedProject = await UpdateData(id, payload, trx);
//     await trx.commit();

//     successResponse(
//       res,
//       200,
//       "success",
//       "Proyek berhasil diperbarui",
//       false,
//       null,
//       projectResponse(updatedProject)
//     );
//   } catch (error) {
//     await trx.rollback();
//     errorResponse(res, 400, "error", error.message);
//   }
// };


// export const deleteProject = async (req, res) => {
//   const { id } = req.params;
//   const trx = await db.transaction();

//   try {
//     const project = await Project.findOne({
//       where: { id },
//       transaction: trx,
//       lock: true,
//     });

//     if (!project) {
//       throw new Error("Project not found");
//     }

//     await project.destroy({ transaction: trx, force: true });
//     await trx.commit();
//   } catch (error) {
//     await trx.rollback();
//     return errorResponse(res, 400, "error", error.message);
//   }

//   return successResponse(
//     res,
//     200,
//     "success",
//     "Project berhasil dihapus",
//     false,
//     null,
//     null
//   );
// };

import db from "../../config/database.js";
import {
  projectResponse,
  CreateData,
  DeleteData,
  GetDataList,
  GetDataById,
  UpdateData,
} from "../../models/project.js";
import Template from "../../models/template.js";
import { successResponse, errorResponse } from "../../helpers/response.js";
import { calculatePagination } from "../../helpers/paginate.js";
import Project from "../../models/project.js";

export const getAllProjects = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const { id: userId, role: userRole } = req.user;
    const filter = { search };
    const elevatedRoles = ['Admin', 'Owner', 'Super Admin'];
    if (!elevatedRoles.includes(userRole)) {
      filter.created_by = userId;
    }
    const result = await GetDataList({ page, limit }, filter);
    const pagination = calculatePagination({ page, limit }, result.totalRows);
    const data = result.data.map(projectResponse);
    successResponse(res, 200, "success", "Proyek berhasil diambil", true, pagination, data);
  } catch (error) {
    errorResponse(res, 500, "error", error.message);
  }
};

export const getProjectById = async (req, res) => {
  try {
    const projectId = req.params.id;
    console.log(`\n[BACKEND] Mencoba mengambil project dengan ID: ${projectId}`);
    
    const project = await GetDataById(projectId);
    
    if (!project) {
      console.log(`[BACKEND] Gagal: Project dengan ID ${projectId} tidak ditemukan.`);
      return errorResponse(res, 404, "error", "Proyek tidak ditemukan.");
    }

    console.log(`[BACKEND] Sukses: Project dengan ID ${projectId} ditemukan.`);
    successResponse(res, 200, "success", "Proyek berhasil ditemukan", false, null, projectResponse(project));
  } catch (error) {
    // --- TAMBAHKAN LOG ERROR DETAIL DI SINI ---
    console.error(`[BACKEND] FATAL ERROR di getProjectById:`, error);
    // --- AKHIR LOG ---
    errorResponse(res, 500, "error", "Terjadi kesalahan internal pada server.");
  }
};


export const createProject = async (req, res) => {
  const trx = await db.transaction();
  try {
    const { project_data, template_id } = req.body;
    const userId = req.user.id;
    if (!project_data || !template_id) {
      throw new Error("Data proyek (project_data) dan template_id wajib diisi.");
    }
    const templateExists = await Template.findByPk(template_id);
    if (!templateExists) {
      await trx.rollback();
      return errorResponse(res, 404, "error", `Template dengan ID ${template_id} tidak ditemukan.`);
    }
    const payload = {
      project_data: typeof project_data === "object" ? JSON.stringify(project_data) : project_data,
      template_id,
      created_by: userId,
      updated_by: userId,
    };
    const newProject = await CreateData(payload, trx);
    await trx.commit();
    const responseData = await GetDataById(newProject.id);
    successResponse(res, 201, "success", "Proyek berhasil dibuat", false, null, projectResponse(responseData));
  } catch (error) {
    await trx.rollback();
    errorResponse(res, 400, "error", error.message);
  }
};

export const updateProject = async (req, res) => {
  const trx = await db.transaction();
  try {
    const { id } = req.params;
    const { project_data, template_id } = req.body;
    const userId = req.user.id;
    const payload = { updated_by: userId };
    if (project_data) {
      payload.project_data = typeof project_data === "object" ? JSON.stringify(project_data) : project_data;
    }
    if (template_id) {
      const templateExists = await Template.findByPk(template_id);
      if (!templateExists) {
        await trx.rollback();
        return errorResponse(res, 404, "error", `Template dengan ID ${template_id} tidak ditemukan.`);
      }
      payload.template_id = template_id;
    }
    if (Object.keys(payload).length <= 1 && !project_data && !template_id) {
      throw new Error("Tidak ada data yang diubah.");
    }
    const updatedProject = await UpdateData(id, payload, trx);
    await trx.commit();
    const responseData = await GetDataById(id);
    successResponse(res, 200, "success", "Proyek berhasil diperbarui", false, null, projectResponse(responseData));
  } catch (error) {
    await trx.rollback();
    errorResponse(res, 400, "error", error.message);
  }
};

export const deleteProject = async (req, res) => {
  const { id } = req.params;
  const trx = await db.transaction();
  try {
    const project = await Project.findByPk(id);
    if (!project) {
      throw new Error("Project not found");
    }
    await DeleteData(id, trx);
    await trx.commit();
    return successResponse(res, 200, "success", "Project berhasil dihapus", false, null, null);
  } catch (error) {
    await trx.rollback();
    return errorResponse(res, 400, "error", error.message);
  }
};