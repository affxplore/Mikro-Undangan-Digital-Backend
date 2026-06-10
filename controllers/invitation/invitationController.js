import db from "../../config/database.js";
import {
  invitationResponse,
  CreateData,
  DeleteData,
  GetDataList,
  UpdateData,
} from "../../models/invitation.js";
import Invitation from "../../models/invitation.js";
import TemplatePesan from "../../models/template_pesan.js";
import Project from "../../models/project.js";
import fs from "fs/promises";
import { existsSync } from "fs"; // ← existsSync hanya ada di modul 'fs' biasa, bukan 'fs/promises'
import path from "path";
import Template from "../../models/template.js";
import User from "../../models/user.js";
import Subscription from "../../models/subscription.js";
import Category from "../../models/category.js";
import { COVER_TYPES } from "../../helpers/coverRegistry.js";
import { successResponse, errorResponse } from "../../helpers/response.js";
import { buildPublicUrl } from "../../helpers/files.js";
import { calculatePagination } from "../../helpers/paginate.js";

export const createFullInvitation = async (req, res) => {
  const trx = await db.transaction();
  try {
    console.log('=== CREATE FULL INVITATION ===');
    console.log('Request body:', req.body);
    
    // 1. Ambil template_id dan semua data form
    const { template_id, ...formData } = req.body;
    console.log('Template ID:', template_id);
    console.log('Form Data:', formData);
    
    const userId = req.user.id;
    console.log('User ID:', userId);

    // Map field 'acara' ke 'tanggal'
    formData.tanggal = formData.acara;

    if (!template_id || !formData.name || !formData.tanggal) {
      console.log('Validation failed:', { 
        template_id, 
        name: formData.name, 
        tanggal: formData.tanggal,
        acara: formData.acara 
      });
      throw new Error("Template, Nama Undangan, dan Tanggal Acara wajib diisi.");
    }
    
    // 2. Ambil data template beserta kategorinya
    const selectedTemplate = await Template.findByPk(template_id, { 
      include: [{ model: Category, as: "category" }] 
    });
    console.log('Selected Template:', {
      id: selectedTemplate?.id,
      category: selectedTemplate?.category?.name,
      thumbnail: selectedTemplate?.thumbnail_file
    });
    
    if (!selectedTemplate || !selectedTemplate.thumbnail_file) {
      console.log('Template not found or no thumbnail:', { 
        templateExists: !!selectedTemplate,
        thumbnailExists: !!selectedTemplate?.thumbnail_file 
      });
      throw new Error(`Data desain template tidak ditemukan.`);
    }

    // 3. Baca dan parse JSON dasar dari template
    // File disimpan di: CWD/public/uploads/... 
    // DB menyimpan path tanpa 'public': /uploads/...
    let filePath = path.join(process.cwd(), 'public', selectedTemplate.thumbnail_file.replace(/^\/+/, ''));

    // ❗ Strategi fallback berlapis jika file tidak ada di path DB
    if (!existsSync(filePath)) {
      console.log("⚠️ File tidak ada di path utama:", filePath);
      let found = false;

      // Fallback 1: coba tanpa subfolder tahun/bulan
      const fallback1 = path.join(process.cwd(), 'public', 'uploads', 'templates', path.basename(selectedTemplate.thumbnail_file));
      if (existsSync(fallback1)) {
        filePath = fallback1;
        found = true;
        console.log("✅ File ditemukan di fallback 1:", filePath);
      }

      // Fallback 2: scan semua subfolder di public/uploads/templates/ cari .json apapun
      if (!found) {
        const { readdirSync } = await import('fs');
        const templatesRoot = path.join(process.cwd(), 'public', 'uploads', 'templates');
        const scanDir = (dir) => {
          try {
            for (const entry of readdirSync(dir, { withFileTypes: true })) {
              const full = path.join(dir, entry.name);
              if (entry.isDirectory()) {
                const result = scanDir(full);
                if (result) return result;
              } else if (entry.name.endsWith('.json')) {
                return full;
              }
            }
          } catch (_) {}
          return null;
        };
        const scanned = scanDir(templatesRoot);
        if (scanned) {
          filePath = scanned;
          found = true;
          console.log("✅ File .json ditemukan via scan:", filePath);
          console.warn("⚠️ PERHATIAN: Path di DB tidak cocok dengan file di disk. Harap update thumbnail_file template ID", selectedTemplate.id, "menjadi path yang benar.");
        }
      }

      if (!found) {
        throw new Error(`File template JSON tidak ditemukan di disk. Harap upload ulang file desain untuk template ID ${selectedTemplate.id}.`);
      }
    }
//     const cleanPath = selectedTemplate.thumbnail_file
//     .replace(/^\/+/, '')
//     .replace(/\\/g, '/');

//        const filePath = path.join(process.cwd(), cleanPath);
//     // const filePath = path.join(process.cwd(), selectedTemplate.thumbnail_file
//     // .replace(/^\/+/, '')) //Hapus Leading Slash jika ada
//     // .replace(/\\/g, '/'); // ubah backslash ke slash

    console.log("📂 FINAL PATH:", filePath);
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const projectData = JSON.parse(fileContent);
    
    // 4. Logika "Builder" Cerdas
    const categoryName = selectedTemplate.category?.name.toLowerCase() || 'default';
    console.log('Category Name:', categoryName);
    
    const mapping = COVER_TYPES[categoryName] || COVER_TYPES.default;
    console.log('Selected Mapping:', mapping);
    
    // Ambil skema dari projectData.cover jika ada, atau buat objek baru
    const coverData = projectData.cover?.data || {};
    console.log('Initial Cover Data:', coverData);

    // Isi data cover berdasarkan pemetaan
    console.log('Starting field mapping...');
    for (const [key, formField] of Object.entries(mapping)) {
      console.log(`Mapping ${formField} -> ${key}:`, {
        formValue: formData[formField],
        exists: formField in formData
      });
      if (formData[formField]) {
        coverData[key] = formData[formField];
      }
    }
    
    // Setel kembali data cover yang sudah diperbarui
    if (projectData.cover) {
      projectData.cover.data = coverData;
      console.log('Updated Cover Data:', coverData);
    } else {
      console.log('Warning: projectData.cover tidak ditemukan');
      // Buat struktur cover jika belum ada
      projectData.cover = {
        data: coverData
      };
    }

    // 5. Buat project dengan project_data yang sudah dimodifikasi
    const newProject = await Project.create({
      template_id: template_id,
      project_data: projectData,
      created_by: userId,
      updated_by: userId,
    }, { transaction: trx });
    
    // 6. Buat undangan seperie biasa
    const payloadInvitation = {
      name: formData.name,
      acara: formData.tanggal,  // Gunakan tanggal yang sudah di-map
      project_id: newProject.id,
      created_by: userId,
      place: formData.lokasi || formData.place || "Lokasi menyusul",
      owner_1: formData.owner_1 || formData.namaPria || formData.namaPerayaan || formData.namaAnak || 
               formData.namaPenyelenggara || formData.namaUsaha || formData.namaGrup || 
               formData.namaAcara || formData.namaWisudawan || formData.namaPesta || "Pemilik Acara",
      owner_2: formData.owner_2 || formData.namaWanita || formData.namaOrangTua || "",
      no_hp: formData.no_hp || formData.noWa,
    };

    const newInvitation = await CreateData(payloadInvitation, trx);

    await trx.commit();
    successResponse(
      res,
      201,
      "success",
      "Undangan berhasil dibuat",
      false,
      null,
      {
        ...invitationResponse(newInvitation),
        type: selectedTemplate.category?.name || 'default'
      }
    );
  } catch (error) {
    await trx.rollback();
    console.error('Error in createFullInvitation:', error);
    errorResponse(res, 400, "error", error.message);
  }
};

// export const getPublicInvitationById = async (req, res) => {
//   try {
//     const invitation = await Invitation.findOne({
//       where: {
//         id: req.params.id,
//         status: 'aktif' // <-- HANYA ambil undangan yang sudah diaktifkan
//       },
//       include: [
//         {
//           model: Project,
//           as: 'project',
//           attributes: ['id', 'project_data']
//         },
//         // Anda bisa include KataUcapan jika perlu
//       ]
//     });
    
//     if (!invitation) {
//       return errorResponse(res, 404, "error", "Undangan tidak ditemukan atau belum aktif.");
//     }


//      const owner = await User.findByPk(invitation.project.created_by, {
//         include: { model: Subscription, as: 'subscription' }
//     });

//     // 2. Tentukan apakah branding harus ditampilkan
//     // Watermark hanya tampil jika slug paket adalah 'free'.
//     const showBranding = owner?.subscription?.slug === 'free';
//     // --- AKHIR LOGIKA BRANDING ---

//     // 3. Gabungkan data undangan dengan flag branding
//     const responseData = {
//         ...invitationResponse(invitation), // Gunakan formatter yang sudah ada
//         showBranding: showBranding // Tambahkan flag ke respons
//     };


//     // Gunakan formatter yang sudah ada
//     successResponse(res, 200, "success", "Undangan berhasil ditemukan", false, null, invitationResponse(invitation));
//   } catch (error) {
//     errorResponse(res, 500, "error", error.message);
//   }
// };

export const getPublicInvitationById = async (req, res) => {
  try {
    const invitation = await Invitation.findOne({
      where: { id: req.params.id },
      include: [{ model: Project, as: 'project', attributes: ['id', 'project_data', 'created_by'] }]
    });
    
    if (!invitation || !invitation.project) { // Ditambahkan pengecekan project
      return errorResponse(res, 404, "error", "Undangan atau data project terkait tidak ditemukan.");
    }

    // validasi status
    if (invitation.status !== 'aktif' ) {
      return errorResponse(res, 403, "error", "Undangan belum aktif");
    }

    // --- TAMBAHKAN LOG UNTUK DEBUGGING DI SINI ---
    const owner = await User.findByPk(invitation.project.created_by, {
        include: { model: Subscription, as: 'subscription' }
    });

    console.log("========================================");
    console.log("[DEBUG] Data Pemilik Ditemukan:", JSON.stringify(owner, null, 2));
    
    const slugPaket = owner?.subscription?.slug;
    console.log("[DEBUG] Slug Paket Langganan:", slugPaket);

    const showBranding = slugPaket === 'free';
    console.log("[DEBUG] Hasil Akhir showBranding:", showBranding);
    console.log("========================================");
    // --- AKHIR LOG ---
    
    const responseData = {
        ...invitationResponse(invitation),
        showBranding: showBranding
    };
    
    successResponse(res, 200, "success", "Undangan berhasil ditemukan", false, null, responseData);
    
  } catch (error) {
    console.error("Error di getPublicInvitationById:", error); // Log error lebih detail
    errorResponse(res, 500, "error", error.message);
  }
};

// GET /invitations -> Mengambil semua undangan dengan paginasi
export const getAllInvitations = async (req, res) => {
  try {
    // 1. Ambil semua parameter dengan benar
    const { page = 1, limit = 6, filter: filterString, sort } = req.query;
    const { id: userId, role: userRole } = req.user;

    // 2. Parsing string filter dengan aman
    let parsedFilter = {};
    if (filterString) {
      try {
        parsedFilter = JSON.parse(filterString);
      } catch (e) {
        // Abaikan jika JSON tidak valid
      }
    }
    
    // 3. Gabungkan filter dari frontend dengan filter otorisasi
    const finalFilter = {
      search: parsedFilter.search,
      category_id: parsedFilter.category_id,
      status: parsedFilter.status, // ← FIX BUG #1: status filter sekarang diteruskan ke DB
    };

    // Terapkan filter kepemilikan untuk non-admin
    if (userRole !== 'Super Admin' && userRole !== 'Owner' && userRole !== 'Admin') {
      finalFilter.created_by = userId;
    }
    
    // Panggil GetDataList dengan variabel yang benar
    const result = await GetDataList({ page, limit }, finalFilter, sort);
    
    const pagination = calculatePagination({ page, limit }, result.totalRows);
    const data = result.data.map(invitationResponse);

    successResponse(res, 200, "success", "Undangan berhasil diambil", true, pagination, data);
  } catch (error) {
    console.error("[ERROR] Gagal mengambil daftar undangan:", error);
    errorResponse(res, 500, "error", error.message, false, null, null);
  }
};

// GET /invitations/:id -> Mengambil satu undangan berdasarkan ID
export const getInvitationById = async (req, res) => {
  try {
    const invitation = await Invitation.findByPk(req.params.id, {
      include: [
        {
          model: Project,
          as: "project",
          attributes: ["id", "project_data"], // <-- Ambil hanya id dan title dari Template
        },
        {
          model: TemplatePesan,
          as: "template_pesan",
          attributes: ["id", "nama_template", "isi_pesan"], // <-- Ambil kolom spesifik dari Template Pesan
        },
      ],
    });

    if (!invitation) {
      return errorResponse(
        res,
        404,
        "error",
        "Undangan tidak ditemukan.",
        false,
        null,
        null
      );
    }

    // Sekarang, 'invitation' akan berisi objek 'template' dan 'template_pesan'
    // Anda mungkin perlu menyesuaikan invitationResponse jika ingin menampilkannya
    successResponse(
      res,
      200,
      "success",
      "Undangan berhasil ditemukan",
      false,
      null,
      invitationResponse(invitation)
    );
  } catch (error) {
    errorResponse(res, 500, "error", error.message, false, null, null);
  }
};

// POST /invitations -> Membuat undangan baru
export const createInvitation = async (req, res) => {
  const trx = await db.transaction();
  try {
    const {
      name,
      project_id,
      acara,
      place,
      longitude,
      latitude,
      owner_1,
      owner_2,
      no_hp,
      template_pesan_id,
    } = req.body;

    // Validasi dasar
    if (!name || !project_id || !acara || !place || !owner_1 || !owner_2) {
      throw new Error(
        "Field project_id, acara, place, owner_1, dan owner_2 wajib diisi."
      );
    }
    // --- TAMBAHAN VALIDASI ---
    // 1. Cek apakah project_id ada
    const projectExists = await Project.findByPk(project_id);
    if (!projectExists) {
      await trx.rollback();
      return errorResponse(
        res,
        404,
        "error",
        `Project dengan ID ${project_id} tidak ditemukan.`,
        false,
        null,
        null
      );
    }

    // 2. Cek apakah template_pesan_id ada (jika dikirim)
    if (template_pesan_id) {
      const templatePesanExists = await TemplatePesan.findByPk(template_pesan_id);
      if (!templatePesanExists) {
        await trx.rollback();
        return errorResponse(
          res,
          404,
          "error",
          `Template Pesan dengan ID ${template_pesan_id} tidak ditemukan.`,
          false,
          null,
          null
        );
      }
    }
    const payload = {
      name,
      project_id,
      acara,
      place,
      longitude,
      latitude,
      owner_1,
      owner_2,
      no_hp,
      template_pesan_id,
    };
    const newInvitation = await CreateData(payload, trx);
    await trx.commit();

    successResponse(
      res,
      201,
      "success",
      "Undangan berhasil dibuat",
      false,
      null,
      invitationResponse(newInvitation)
    );
  } catch (error) {
    await trx.rollback();
    errorResponse(res, 400, "error", error.message, false, null, null);
  }
};


// DELETE /invitations/:id -> Menghapus undangan
export const deleteInvitation = async (req, res) => {
  const { id } = req.params;
  const trx = await db.transaction(); // Mulai transaksi

  try {
    // 1. Cari undangan yang akan dihapus untuk mendapatkan project_id
    const invitation = await Invitation.findByPk(id, { transaction: trx });

    if (!invitation) {
      throw new Error("Undangan tidak ditemukan.");
    }

    const projectId = invitation.project_id;

    // 2. Hapus data dari tabel invitations terlebih dahulu
    await invitation.destroy({ transaction: trx });

    // 3. Hapus data dari tabel projects menggunakan projectId
    if (projectId) {
      await Project.destroy({
        where: { id: projectId },
        transaction: trx,
      });
    }

    // 4. Jika semua berhasil, commit transaksi
    await trx.commit();

    successResponse(
      res,
      200,
      "success",
      "Undangan dan project terkait berhasil dihapus"
    );
  } catch (error) {
    // 5. Jika ada error, batalkan semua perubahan
    await trx.rollback();
    errorResponse(res, 400, "error", error.message);
  }
};

// export const activateInvitation = async (req, res) => {
//   // Tes untuk tombol "Aktifkan"
//   throw new Error("--- TES BERHASIL: Permintaan 'Aktifkan' sampai di controller 'activateInvitation' ---");
// };

// // --- GANTI FUNGSI INI JUGA ---
// export const updateInvitation = async (req, res) => {
//   // Tes untuk tombol "Nonaktifkan"
//   throw new Error("--- TES BERHASIL: Permintaan 'Nonaktifkan' sampai di controller 'updateInvitation' ---");
// };



// // PUT /invitations/:id -> Memperbarui undangan
// export const updateInvitation = async (req, res) => {
//    console.log("\n--- FUNGSI updateInvitation DIMULAI ---");
//   const trx = await db.transaction();
//   try {
//     const { id } = req.params;
//      console.log("[LOG 1] Isi req.body yang diterima:", req.body);

//     const { 
//         name, project_id, acara, place, longitude, latitude, owner_1, 
//         owner_2, no_hp, kata_ucapan_id, status 
//     } = req.body;

//     // --- 2. BUAT PAYLOAD DENGAN SEMUA KEMUNGKINAN DATA ---
//     const payload = { 
//         name, project_id, acara, place, longitude, latitude, owner_1, 
//         owner_2, no_hp, kata_ucapan_id, status 
//     };
//  console.log("[LOG 2] Isi 'payload' SETELAH destrukturisasi:", payload);

//     // Hapus properti yang tidak didefinisikan agar tidak menimpa dengan null
//   Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);

//     // LOG 3: Lihat isi payload SETELAH properti 'undefined' dihapus
//     console.log("[LOG 3] Isi 'payload' SETELAH dibersihkan:", payload);
    
//     // LOG 4: Lihat jumlah keys sebelum pengecekan
//     console.log("[LOG 4] Jumlah keys di payload:", Object.keys(payload).length);

//     if (Object.keys(payload).length === 0) {
//       console.error("[KESALAHAN] Payload kosong, melempar error 'Tidak ada data yang diubah.'");
//       throw new Error("Tidak ada data yang diubah.");
//     }

//     if (payload.template_pesan_id) {
//       const templatePesanExists = await TemplatePesan.findByPk(payload.template_pesan_id);
//       if (!templatePesanExists) {
//         throw new Error(`Template Pesan dengan ID ${payload.template_pesan_id} tidak ditemukan.`);
//       }
//     }

//     const updatedInvitation = await UpdateData(id, payload, trx);
//     await trx.commit();
//      console.log("--- FUNGSI updateInvitation BERHASIL ---");
   

//     successResponse(
//       res,
//       200,
//       "success",
//       "Undangan berhasil diperbarui",
//       false,
//       null,
//       invitationResponse(updatedInvitation)
//     );
//   } catch (error) {
//     await trx.rollback();
//     console.error("--- FUNGSI updateInvitation GAGAL ---", error.message);
//    console.error("[LOG 5] Isi 'payload' sebelum error:", payload);
//     errorResponse(res, 400, "error", error.message, false, null, null);
//   }
// };

// // --- FUNGSI BARU UNTUK GERBANG AKTIVASI ---
// export const activateInvitation = async (req, res) => {
//   const { id: invitationId } = req.params;
//   const { id: userId } = req.user;
//   const trx = await db.transaction();

//   try {
//     // Langkah 1: Ambil semua data yang diperlukan
//     // Ambil data user beserta paket langganan yang terhubung
//     const user = await User.findByPk(userId, {
//       include: { model: Subscription, as: 'subscription' },
//       transaction: trx
//     });

//     const invitation = await Invitation.findByPk(invitationId, { transaction: trx });

//     // Hitung jumlah undangan yang SUDAH aktif milik user ini
//     const activeInvitationsCount = await Invitation.count({
//       where: { created_by: userId, status: 'aktif' }, // Pastikan ada kolom created_by di model Invitation
//       transaction: trx
//     });

//     // Langkah 2: Lakukan Pengecekan (Gerbang)
//     if (!user.subscription) {
//       throw { status: 403, message: "Anda tidak memiliki paket langganan yang aktif." };
//     }
//     if (invitation.created_by !== userId) {
//       throw { status: 403, message: "Anda bukan pemilik undangan ini." };
//     }
//     if (invitation.status === 'aktif') {
//       throw { status: 400, message: "Undangan ini sudah aktif." };
//     }
//     if (activeInvitationsCount >= user.subscription.invitation_limit) {
//       throw { status: 403, message: `Batas undangan aktif (${user.subscription.invitation_limit}) untuk paket Anda sudah tercapai. Silakan upgrade.` };
//     }

//     // Langkah 3: Jika semua pengecekan lolos, aktifkan undangan
//     await invitation.update({ status: 'aktif' }, { transaction: trx });
    
//     await trx.commit();
//     successResponse(res, 200, "success", "Undangan berhasil diaktifkan!", false, null, invitationResponse(invitation));

//   } catch (error) {
//     await trx.rollback();
//     // Kirim kode status yang sesuai jika kita definisikan, atau 400 untuk error umum
//     const errorCode = error.status || 400;
//     errorResponse(res, errorCode, "error", error.message);
//   }
// };

export const activateInvitation = async (req, res) => {
  const { id: invitationId } = req.params;
  const { id: userId } = req.user;
  const trx = await db.transaction();

  try {
    const user = await User.findByPk(userId, {
      include: { model: Subscription, as: 'subscription' }
    });

    // Ambil undangan beserta data project-nya untuk cek kepemilikan
    const invitation = await Invitation.findByPk(invitationId, {
      include: { model: Project, as: 'project', attributes: ['created_by'] }
    });

    if (!invitation || !invitation.project) {
        throw { status: 404, message: "Undangan atau data project terkait tidak ditemukan."};
    }

    // Hitung undangan aktif melalui join ke tabel projects
    const activeInvitationsCount = await Invitation.count({
      where: { status: 'aktif' },
      include: {
        model: Project,
        as: 'project',
        where: { created_by: userId }, // Cek kepemilikan di tabel project
        required: true
      }
    });

    // --- Pengecekan Gerbang Aktivasi ---
    if (!user.subscription) {
      throw { status: 403, message: "Anda tidak memiliki paket langganan." };
    }
    if (invitation.project.created_by !== userId) {
      throw { status: 403, message: "Anda bukan pemilik undangan ini." };
    }
    if (invitation.status === 'aktif') {
      throw { status: 400, message: "Undangan ini sudah aktif." };
    }
    if (activeInvitationsCount >= user.subscription.invitation_limit) {
      throw { status: 403, message: `Batas undangan aktif (${user.subscription.invitation_limit}) untuk paket Anda sudah tercapai.` };
    }

    await invitation.update({ status: 'aktif' }, { transaction: trx });
    
    await trx.commit();
    successResponse(res, 200, "success", "Undangan berhasil diaktifkan!");

  } catch (error) {
    await trx.rollback();
    const errorCode = error.status || 400;
    errorResponse(res, errorCode, "error", error.message);
  }
};


// export const activateInvitation = async (req, res) => {
//   const { id: invitationId } = req.params;
//   const { id: userId } = req.user;
//   const trx = await db.transaction();

//   try {
//     const user = await User.findByPk(userId, {
//       include: { model: Subscription, as: 'subscription' }
//     });

//     // --- PERBAIKAN 1: Ambil undangan beserta data project-nya ---
//     const invitation = await Invitation.findByPk(invitationId, {
//       include: { model: Project, as: 'project' },
//       transaction: trx
//     });

//     // --- PERBAIKAN 2: Hitung undangan aktif melalui join ---
//     const activeInvitationsCount = await Invitation.count({
//       where: { status: 'aktif' },
//       include: {
//         model: Project,
//         as: 'project',
//         where: { created_by: userId }, // Cek kepemilikan di tabel project
//         required: true, // Pastikan hanya undangan milik user ini yang dihitung
//       },
//       transaction: trx
//     });

//     if (!user.subscription) {
//       throw { status: 403, message: "Anda tidak memiliki paket langganan." };
//     }
//     // --- PERBAIKAN 3: Cek kepemilikan melalui project ---
//     if (invitation.project.created_by !== userId) {
//       throw { status: 403, message: "Anda bukan pemilik undangan ini." };
//     }
//     if (invitation.status === 'aktif') {
//       throw { status: 400, message: "Undangan ini sudah aktif." };
//     }
//     if (activeInvitationsCount >= user.subscription.invitation_limit) {
//       throw { status: 403, message: `Batas undangan aktif (${user.subscription.invitation_limit}) tercapai.` };
//     }

//     await invitation.update({ status: 'aktif' }, { transaction: trx });
    
//     await trx.commit();
//     successResponse(res, 200, "success", "Undangan berhasil diaktifkan!");

//   } catch (error) {
//     await trx.rollback();
//     const errorCode = error.status || 400;
//     errorResponse(res, errorCode, "error", error.message);
//   }
// };

export const updateInvitation = async (req, res) => {
  const trx = await db.transaction();
  try {
    const { id } = req.params;
    
    // Ambil semua kemungkinan field dari body request
    const { 
        name, project_id, acara, place, longitude, latitude, owner_1, 
        owner_2, no_hp, kata_ucapan_id, status
    } = req.body;
    console.log(req.body)

    // Buat payload dengan semua field tersebut
    const payload = { 
        name, project_id, acara, place, longitude, latitude, owner_1, 
        owner_2, no_hp, kata_ucapan_id, status
    };

    // Hapus semua field yang tidak dikirim (undefined) dari payload
    // Ini memastikan kita hanya mengupdate apa yang dikirim dari frontend
    Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);

    // Jika payload benar-benar kosong setelah dibersihkan, baru lempar error
    if (Object.keys(payload).length === 0) {
      throw new Error("Tidak ada data yang diubah.");
    }

    const updatedInvitation = await UpdateData(trx, id, payload);
    await trx.commit();

    successResponse(res, 200, "success", "Undangan berhasil diperbarui", false, null, invitationResponse(updatedInvitation));
  } catch (error) {
    await trx.rollback();
    errorResponse(res, 400, "error", error.message);
  }
};