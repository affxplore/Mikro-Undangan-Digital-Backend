// =================================================================
// ROUTERS.JS - MAIN API ROUTES CONFIGURATION
// =================================================================
import express from "express";
import path from "path";
import multer from "multer";

// =================================================================
// 1. IMPORT SEMUA CONTROLLER
// =================================================================
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  updateMyProfile,
  toggleUserStatus,
} from "../controllers/user/userController.js";
import {
  register,
  login,
  refreshToken,
  logout,
    verifyOtp,    
  requestOtp, 
  forgotPassword, // <-- IMPORT BARU
  resetPassword,
} from "../controllers/user/authController.js";
import {
  getAllTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
} from "../controllers/template/templateController.js";
import { getTemplatesByCategory } from "../controllers/template/templateController.js";

const router = express.Router();

import {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
} from "../controllers/project/projectController.js";
import {
  getAllInvitations,
  getInvitationById,
  createInvitation,
  updateInvitation,
  deleteInvitation,
  createFullInvitation,
  getPublicInvitationById,
  activateInvitation, // <-- Impor fungsi baru
} from "../controllers/invitation/invitationController.js";
import {
  getAllPayments,
  getPaymentById,
  createPayment,
  updatePayment,
  deletePayment,
  // createSubscriptionPayment,
  // handleMidtransWebhook,
} from "../controllers/payment/paymentController.js";
import {
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  getAllAccessLevels,
} from "../controllers/role/roleController.js";
import {
  getAllDiscounts,
  getDiscountById,
  createDiscount,
  updateDiscount,
  deleteDiscount,
} from "../controllers/discount/discountController.js";
import {
  getAllSystemContents,
  getSystemContentById,
  createSystemContent,
  updateSystemContent,
  deleteSystemContent,
  getDistinctTypes,
} from "../controllers/systemContent/systemContentController.js";
import {
  getAllReceive_invs,
  getReceive_invById,
  createReceive_inv,
  updateReceive_inv,
  deleteReceive_inv,
  importGuests,
  getGuestByCode,
  acceptInvitation,
} from "../controllers/receive_inv/receive_invController.js";
import {
  getAllKategoriPesan,
  getKategoriPesanById,
  createKategoriPesan,
  updateKategoriPesan,
  deleteKategoriPesan,
} from "../controllers/kategori_pesan/kategori_pesanController.js";
import {
  getAllTemplatePesan,
  getTemplatePesanById,
  createTemplatePesan,
  updateTemplatePesan,
  deleteTemplatePesan,
} from "../controllers/template_pesan/template_pesanController.js";
import {
  getAllTemplateSalam,
  getTemplateSalamById,
  createTemplateSalam,
  updateTemplateSalam,
  deleteTemplateSalam,
} from "../controllers/template_salam/template_salamController.js";
import {
  getAllSubscriptions,
  getSubscriptionById,
  createSubscription,
  updateSubscription,
  deleteSubscription,
  createSubscriptionWithPrices,
  updateSubscriptionWithPrices
} from "../controllers/subscription/subscriptionController.js";
import {
  getAllPrices,
  getPriceById,
  createPrice,
  updatePrice,
  deletePrice,
} from "../controllers/price/priceController.js";
import {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/category/categoryController.js";
import {
  getAllUcapanTamus,
  getUcapanTamuById,
  createUcapanTamu,
  updateUcapanTamu,
  deleteUcapanTamu, 
} from "../controllers/ucapanTamu/ucapanTamuController.js";
import {
  getAllTransaksi,
  getTransaksiById,
  createTransaksi,
  updateTransaksi,
  deleteTransaksi,
  createSubscriptionPayment,
  handleMidtransWebhook,
} from "../controllers/transaksi/transaksiController.js";
import * as afiliasiController from '../controllers/afiliasi/afiliasiController.js';
import * as komisiController from '../controllers/komisi/komisiController.js';


import * as systemMessageController from '../controllers/systemMessage/systemMessageController.js';
import {
  getAllUserNotifications,
  getUserNotificationById,
  updateUserNotification,
  deleteUserNotification
} from '../controllers/userNotification/userNotificationController.js';



// =================================================================
// 2. IMPORT SEMUA MIDDLEWARE
// =================================================================
import {
  verifyToken,
  hasRole,
  isProjectOwner,
   isInvitationOwnerOrAdmin, 
} from '../middlewares/authMiddleware.js';
import {
  uploadProfile,
  handleTemplateUploads,
  uploadCategoryIcon,
  uploadQrCode,
  uploadExcel,
} from '../middlewares/uploadMiddleware.js';
import passport from 'passport';
import '../config/passport-setup.js'; 
import jwt from 'jsonwebtoken'; 
import User from '../models/user.js'; 
import Role from '../models/role.js';
import { buildPublicUrl } from '../helpers/files.js';

 
// =================================================================
// 3. INISIALISASI ROUTER
// =================================================================
const mainRouter = express.Router();
const prefix = '/api/v1';
const upload = multer();

// =================================================================
// 4. GRUP 1: RUTE PUBLIK & AUTENTIKASI (TIDAK PERLU TOKEN)
// =================================================================
const authRouter = express.Router();
authRouter.post('/register', register);
authRouter.post('/login', login);
// --- RUTE OTP BARU ---
authRouter.post('/verify-otp', verifyOtp);
authRouter.post('/request-otp', requestOtp);
// ---------------------
// --- RUTE LUPA PASSWORD BARU ---
authRouter.post('/forgot-password', forgotPassword);
// Token akan menjadi bagian dari URL, misal: /auth/reset-password/TOKENNYADISINI
authRouter.post('/reset-password/:token', resetPassword);
// ------------------------------
authRouter.get('/refresh-token', refreshToken);
authRouter.post('/logout', logout);
authRouter.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Endpoint ini adalah callback yang akan dituju setelah login Google berhasil
authRouter.get(
    '/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: '/login' }),
    // --- 3. Ubah fungsi ini menjadi async ---
    async (req, res) => {
        try {
            // req.user dari passport berisi data user dasar (tanpa relasi)
            const basicUser = req.user;

            // --- 4. Ambil data user LENGKAP dari database beserta role-nya ---
            const fullUser = await User.findOne({
                where: { id: basicUser.id },
                include: {
                    model: Role,
                    as: 'role',
                    attributes: ['name'] // Ambil hanya nama role
                }
            });

            if (!fullUser || !fullUser.role) {
                console.error(`Otentikasi Gagal: User dengan ID ${basicUser.id} tidak memiliki role yang valid.`);
                // Arahkan ke halaman login dengan pesan error yang lebih spesifik
                return res.redirect(`${process.env.FRONTEND_URL}/login?error=invalid_role`);
            }

            // --- 5. Gunakan fullUser untuk membuat payload token ---
            const payload = {
                id: fullUser.id,
                name: fullUser.full_name,
                email: fullUser.email,
                 username: fullUser.username, 
                role: fullUser.role.name, // Sekarang fullUser.role sudah ada
                permissions: [], // Sesuaikan ini jika Anda sudah implementasi permissions
                 avatarUrl: fullUser.profilePicture ? buildPublicUrl(fullUser.profilePicture) : null,
                  subscription: fullUser.subscription ? fullUser.subscription.name : null
            
            };

            const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "60m" });

            res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${accessToken}`);

        } catch (error) {
            console.error("Error di callback Google Auth:", error);
            res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
        }
    }
);
// -----------------------------
mainRouter.use(`${prefix}/auth`, authRouter);
mainRouter.use("/public", express.static(path.join(process.cwd(), "public")));


// =================================================================
// 5. GRUP 2: RUTE PENGGUNA (USERS)
// =================================================================
const userRouter = express.Router();
// Terapkan 'verifyToken' ke SEMUA rute di dalam grup ini
userRouter.use(verifyToken);

// --- Rute untuk pengguna mengedit profilnya sendiri ---
// Frontend memanggil: PUT /api/v1/users/1/profile
userRouter.put(
  '/:id/profile',
  // Middleware keamanan: Pastikan user hanya bisa mengedit profilnya sendiri
  (req, res, next) => {
    if (req.user.id !== parseInt(req.params.id, 10)) {
      return res.status(403).json({ meta: { status: 'error', message: 'Forbidden: Anda tidak diizinkan mengubah profil ini.' } });
    }
    next(); // Lanjutkan jika ID cocok
  },
  uploadProfile.single('profilePicture'),
  updateMyProfile
);

// --- Rute di bawah ini hanya untuk Admin/Owner ---
userRouter.get('/', hasRole('Super Admin', 'Owner','Admin'), getAllUsers);
userRouter.get('/:id', hasRole('Super Admin', 'Owner','Admin'), getUserById);
userRouter.post('/', hasRole('Super Admin', 'Owner','Admin'), uploadProfile.single('profilePicture'), createUser);
userRouter.put('/:id', hasRole('Super Admin', 'Owner','Admin'), uploadProfile.single('profilePicture'), updateUser);
userRouter.delete('/:id', hasRole('Super Admin', 'Owner','Admin'), deleteUser);
userRouter.patch('/:id/status', hasRole('Super Admin', 'Owner','Admin'), toggleUserStatus);

mainRouter.use(`${prefix}/users`, userRouter);





// =================================================================
// 7. GRUP 4: RUTE TEMPLATE (PERLU TOKEN)
// =================================================================
const templateRouter = express.Router();
templateRouter.get('/', getAllTemplates);
templateRouter.get('/:id', getTemplateById);
router.get('/:id/templates', getTemplatesByCategory);
templateRouter.use(verifyToken);
// templateRouter.get('/', getAllTemplates);
// templateRouter.get('/:id', getTemplateById);
// templateRouter.get("/by-category/:categoryId", hasRole('Super Admin', 'Owner','Admin'), getTemplatesByCategory);
templateRouter.post('/', hasRole('Super Admin', 'Owner','Admin'), handleTemplateUploads, createTemplate);
templateRouter.put('/:id', hasRole('Super Admin', 'Owner','Admin'), handleTemplateUploads, updateTemplate);
templateRouter.delete('/:id', hasRole('Super Admin', 'Owner','Admin'), deleteTemplate);
mainRouter.use(`${prefix}/templates`, templateRouter);


// =================================================================
// 8. GRUP 5: RUTE DATA MASTER (HANYA ADMIN/OWNER)
// =================================================================
// --- Roles ---
const roleRouter = express.Router();
roleRouter.use(verifyToken, hasRole('Super Admin', 'Owner','Admin'));
roleRouter.get('/', getAllRoles);
roleRouter.get('/:id', getRoleById);
roleRouter.post('/', upload.none(), createRole);
roleRouter.put('/:id', upload.none(), updateRole);
roleRouter.delete('/:id', deleteRole);
mainRouter.use(`${prefix}/roles`, roleRouter);

// --- Access Lv ---
const accessLevelRouter = express.Router();
accessLevelRouter.use(verifyToken, hasRole('Super Admin', 'Owner','Admin'));
accessLevelRouter.get('/', getAllAccessLevels);
mainRouter.use(`${prefix}/access-levels`, accessLevelRouter);

// --- Categories ---
const categoryRouter = express.Router();
categoryRouter.get('/', getAllCategories);
categoryRouter.get('/:id', getCategoryById);
categoryRouter.get('/:id/templates', getTemplatesByCategory);
categoryRouter.use(verifyToken, hasRole('User', 'Super Admin', 'Owner','Admin'));
categoryRouter.post('/', uploadCategoryIcon.single('img_icon'), createCategory);
categoryRouter.put('/:id', uploadCategoryIcon.single('img_icon'), updateCategory);
categoryRouter.delete('/:id', deleteCategory);
mainRouter.use(`${prefix}/categories`, categoryRouter);

// --- Payments ---
const paymentRouter = express.Router();
// mainRouter.post(`${prefix}/payments/webhook`, handleMidtransWebhook);

// paymentRouter.post('/webhook', handleMidtransWebhook);
paymentRouter.use(verifyToken);
// paymentRouter.post('/create-subscription-payment', createSubscriptionPayment);
paymentRouter.get('/', getAllPayments);
paymentRouter.get('/:id', getPaymentById);
paymentRouter.post('/', uploadQrCode.single('qr_code'), hasRole('Super Admin', 'Owner','Admin'), createPayment);
paymentRouter.put('/:id', uploadQrCode.single('qr_code'), hasRole('Super Admin', 'Owner','Admin'), updatePayment);
paymentRouter.delete('/:id', hasRole('Super Admin', 'Owner','Admin'), deletePayment);
mainRouter.use(`${prefix}/payments`, paymentRouter);

// --- Discounts ---
const discountRouter = express.Router();
discountRouter.get('/',  getAllDiscounts);
discountRouter.get('/:id', getDiscountById);
discountRouter.use(verifyToken, hasRole('Super Admin', 'Owner','Admin'));
discountRouter.post('/', upload.none(), createDiscount);
discountRouter.put('/:id', upload.none(), updateDiscount);
discountRouter.delete('/:id', deleteDiscount);
mainRouter.use(`${prefix}/discounts`, discountRouter);

// --- Subscriptions ---
const subscriptionRouter = express.Router();
// Public routes (no auth required)
subscriptionRouter.get('/', getAllSubscriptions);
subscriptionRouter.get('/:id', getSubscriptionById);
// Protected routes
subscriptionRouter.use(verifyToken, hasRole('Super Admin', 'Owner','Admin'));
// Special endpoints MUST come before /:id to avoid route conflicts
subscriptionRouter.post('/with-prices', upload.none(), createSubscriptionWithPrices);
subscriptionRouter.put('/:id/with-prices', upload.none(), updateSubscriptionWithPrices);
// Standard CRUD (after special routes)
subscriptionRouter.post('/', upload.none(), createSubscription);
subscriptionRouter.put('/:id', upload.none(), updateSubscription);
subscriptionRouter.delete('/:id', deleteSubscription);

mainRouter.use(`${prefix}/subscriptions`, subscriptionRouter);

// --- Prices (Harga) ---
const priceRouter = express.Router();
priceRouter.get('/', getAllPrices);
priceRouter.get('/:id', getPriceById);
priceRouter.use(verifyToken, hasRole('Super Admin', 'Owner','Admin'));
priceRouter.post('/', upload.none(), createPrice);
priceRouter.put('/:id', upload.none(), updatePrice);
priceRouter.delete('/:id', deletePrice);
mainRouter.use(`${prefix}/prices`, priceRouter);

// --- System Contents ---
const systemContentRouter = express.Router();
systemContentRouter.get('/', getAllSystemContents);
systemContentRouter.get('/:id', getSystemContentById);
systemContentRouter.get('/types', getDistinctTypes); 
systemContentRouter.use(verifyToken, hasRole('Super Admin', 'Owner','Admin'));
systemContentRouter.post('/', upload.none(), createSystemContent);
systemContentRouter.put('/:id', upload.none(), updateSystemContent);
systemContentRouter.delete('/:id', deleteSystemContent);
mainRouter.use(`${prefix}/system-contents`, systemContentRouter);

// --- Admin Seeder ---
import { checkSeedStatus, initSeed, forceSeed } from '../controllers/admin/seedController.js';
const adminSeederRouter = express.Router();
adminSeederRouter.use(verifyToken, hasRole('Owner', 'Super Admin', 'Admin')); // Only super admin and admin can access
adminSeederRouter.get('/status', checkSeedStatus);
adminSeederRouter.post('/', initSeed);
adminSeederRouter.post('/force', forceSeed);
mainRouter.use(`${prefix}/admin/seed`, adminSeederRouter);

// =================================================================
// RUTE UCAPAN TAMU (RSVP)
// =================================================================
// --- Ucapan Tamu ---
const ucapanRouter = express.Router();
ucapanRouter.use( verifyToken );// Pakai verifyToken jika ingin send_by otomatis terisi
ucapanRouter.get('/', getAllUcapanTamus);
ucapanRouter.get('/:id', getUcapanTamuById);
ucapanRouter.post('/', upload.none(), createUcapanTamu);
ucapanRouter.put('/:id', upload.none(), updateUcapanTamu);
ucapanRouter.delete('/:id', deleteUcapanTamu);
mainRouter.use(`${prefix}/ucapan_tamus`, ucapanRouter);

// =================================================================
// 9. GRUP 6: RUTE FITUR PENGGUNA (PERLU TOKEN)
// =================================================================
// --- Projects ---
const projectRouter = express.Router();
projectRouter.use(verifyToken);
projectRouter.get('/', getAllProjects);
projectRouter.post('/', upload.none(), createProject);
projectRouter.get('/:id', isProjectOwner, getProjectById);
projectRouter.put('/:id', isProjectOwner, upload.none(), updateProject);
projectRouter.delete('/:id', isProjectOwner, deleteProject);
mainRouter.use(`${prefix}/projects`, projectRouter);

// --- Invitations ---
const invitationRouter = express.Router();
invitationRouter.get('/public/:id', getPublicInvitationById);
invitationRouter.use(verifyToken);
invitationRouter.patch('/:id/activate', activateInvitation);
invitationRouter.get('/', getAllInvitations); 
invitationRouter.post('/create-full', createFullInvitation); 
invitationRouter.post('/', upload.none(), createInvitation);
// --- 2. TERAPKAN MIDDLEWARE DI RUTE SPESIFIK ---
invitationRouter.get('/:id', isInvitationOwnerOrAdmin, getInvitationById);
invitationRouter.put('/:id', isInvitationOwnerOrAdmin, upload.none(), updateInvitation);
invitationRouter.delete('/:id', isInvitationOwnerOrAdmin, deleteInvitation);
mainRouter.use(`${prefix}/invitations`, invitationRouter);

// --- Receiver Invitations ---
const receive_invRouter = express.Router();
receive_invRouter.get('/public/by-code/:code', getGuestByCode);
receive_invRouter.patch('/public/accept/:code', acceptInvitation);
receive_invRouter.use(verifyToken);
receive_invRouter.post('/import/:invitationId', uploadExcel.single('file'), importGuests);
receive_invRouter.get('/', getAllReceive_invs);
receive_invRouter.get('/:id', getReceive_invById);
receive_invRouter.post('/', upload.none(), createReceive_inv);
receive_invRouter.put('/:id', upload.none(), updateReceive_inv);
receive_invRouter.delete('/:id', deleteReceive_inv);
mainRouter.use(`${prefix}/receive_invs`, receive_invRouter);

// --- Kategori Pesan ---
const kategoriPesanRouter = express.Router();
kategoriPesanRouter.use(verifyToken);
kategoriPesanRouter.get('/', getAllKategoriPesan);
kategoriPesanRouter.get('/:id', getKategoriPesanById);
kategoriPesanRouter.post('/', upload.none(), createKategoriPesan);
kategoriPesanRouter.put('/:id', upload.none(), updateKategoriPesan);
kategoriPesanRouter.delete('/:id', deleteKategoriPesan);
mainRouter.use(`${prefix}/kategori_pesans`, kategoriPesanRouter);

// --- Template Pesan ---
const templatePesanRouter = express.Router();
templatePesanRouter.use(verifyToken);
templatePesanRouter.get('/', getAllTemplatePesan);
templatePesanRouter.get('/:id', getTemplatePesanById);
templatePesanRouter.post('/', upload.none(), createTemplatePesan);
templatePesanRouter.put('/:id', upload.none(), updateTemplatePesan);
templatePesanRouter.delete('/:id', deleteTemplatePesan);
mainRouter.use(`${prefix}/template_pesans`, templatePesanRouter);

// --- Template Salam ---
const templateSalamRouter = express.Router();
templateSalamRouter.use(verifyToken);
templateSalamRouter.get('/', getAllTemplateSalam);
templateSalamRouter.get('/:id', getTemplateSalamById);
templateSalamRouter.post('/', upload.none(), createTemplateSalam);
templateSalamRouter.put('/:id', upload.none(), updateTemplateSalam);
templateSalamRouter.delete('/:id', deleteTemplateSalam);
mainRouter.use(`${prefix}/template_salams`, templateSalamRouter);

// =================================================================
// 9. GRUP 7: RUTE BARU (TRANSAKSI, AFILIASI, KOMISI)
// =================================================================

// --- Transaksi ---

mainRouter.post(`${prefix}/transactions/webhook`, handleMidtransWebhook);
const transaksiRouter = express.Router();
transaksiRouter.use(verifyToken); // Middleware otentikasi untuk semua rute transaksi
transaksiRouter.get('/', getAllTransaksi);
transaksiRouter.get('/:id', getTransaksiById);
transaksiRouter.post('/', createTransaksi);
transaksiRouter.post('/create-payment-link', createSubscriptionPayment);
transaksiRouter.put('/:id', updateTransaksi);
transaksiRouter.delete('/:id', deleteTransaksi);
mainRouter.use(`${prefix}/transactions`, transaksiRouter);

// --- Afiliasi ---
const afiliasiRouter = express.Router();
afiliasiRouter.use(verifyToken, hasRole('Super Admin', 'Owner','Admin')); // Hanya admin/owner
afiliasiRouter.get('/', afiliasiController.getAllAfiliasi);
afiliasiRouter.get('/:id', afiliasiController.getAfiliasiById);
afiliasiRouter.post('/', afiliasiController.createAfiliasi);
afiliasiRouter.put('/:id', afiliasiController.updateAfiliasi);
afiliasiRouter.delete('/:id', afiliasiController.deleteAfiliasi);
mainRouter.use(`${prefix}/afiliasis`, afiliasiRouter);

// --- Komisi ---
const komisiRouter = express.Router();
komisiRouter.use(verifyToken); // Hanya admin/owner
komisiRouter.get('/', komisiController.getAllKomisi);
komisiRouter.get('/:id', komisiController.getKomisiById);
komisiRouter.post('/', komisiController.createKomisi);
komisiRouter.put('/:id', komisiController.updateKomisi);
komisiRouter.delete('/:id', komisiController.deleteKomisi);
mainRouter.use(`${prefix}/komisis`, komisiRouter);

// --- Dashboard ---
import { adminSummary, userSummary } from "../controllers/dashboard/dashboardController.js";

const Dashboardrouter = express.Router();
// Route utama dashboard (otomatis bedain admin/user)
Dashboardrouter.get("/", verifyToken, (req, res) => {
  const userRole = req.user?.role;

  if (userRole === "Super Admin" || userRole === "Owner") {
    return adminSummary(req, res);
  } else if (userRole === "User") {
    return userSummary(req, res);
  } else {
    return res.status(403).json({
      success: false,
      message: "Unauthorized access to dashboard",
    });
  }
});
// Kalau mau akses langsung by role (optional)
Dashboardrouter.get("/admin-stats", verifyToken, hasRole("Super Admin", "Owner"), adminSummary);
Dashboardrouter.get("/user-stats", verifyToken, hasRole("User"), userSummary);
mainRouter.use(`${prefix}/dashboard`, Dashboardrouter);

// --- System Messages ---
const systemMessageRouter = express.Router();
systemMessageRouter.use(verifyToken, hasRole('Super Admin', 'Owner','Admin'));
systemMessageRouter.get('/', systemMessageController.listSystemMessages);
systemMessageRouter.get('/:id', systemMessageController.getSystemMessage);
systemMessageRouter.post('/', upload.none(), systemMessageController.createSystemMessage);
systemMessageRouter.put('/:id', upload.none(), systemMessageController.updateSystemMessage);
systemMessageRouter.delete('/:id', systemMessageController.deleteSystemMessage);
mainRouter.use(`${prefix}/system-messages`, systemMessageRouter);


// --- User Notifications ---
const userNotificationRouter = express.Router();
userNotificationRouter.use(verifyToken); // semua user login bisa akses
userNotificationRouter.get('/', getAllUserNotifications);
userNotificationRouter.get('/:id', getUserNotificationById);
userNotificationRouter.put('/:id', updateUserNotification);
userNotificationRouter.delete('/:id', deleteUserNotification);
mainRouter.use(`${prefix}/user-notifications`, userNotificationRouter);

// =================================================================
// 10. EKSPOR ROUTER UTAMA
// =================================================================
export default mainRouter;