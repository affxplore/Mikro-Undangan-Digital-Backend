// middlewares/upload.js (ESM)
import multer from "multer";
import fs from "fs";
import path from "path";

function ensureDirSync(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const now = new Date();
    const yyyy = String(now.getFullYear());
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dest = path.join(
      process.cwd(),
      "public",
      "uploads",
      "profile-pictures",
      yyyy,
      mm
    );
    ensureDirSync(dest);
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || ".png";
    const base = path
      .basename(file.originalname, ext)
      .replace(/[^a-z0-9_-]/gi, "-")
      .toLowerCase();
    const unique = Date.now();
    cb(null, `${unique}-${base}${ext}`);
  },
});

function fileFilter(req, file, cb) {
  const ok = ["image/jpeg", "image/png", "image/webp", "image/jpg"].includes(
    file.mimetype
  );
  if (!ok) return cb(new Error("File harus gambar (JPG/PNG/WEBP)."), false);
  cb(null, true);
}

export const uploadProfile = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
});

// 1. Konfigurasi storage khusus untuk template
const templateStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const now = new Date();
    const yyyy = String(now.getFullYear());
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dest = path.join(process.cwd(), "public", "uploads", "templates", yyyy, mm);
    ensureDirSync(dest);
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || ".dat";
    const base = path.basename(file.originalname, ext).replace(/[^a-z0-9_-]/gi, "-").toLowerCase();
    const unique = Date.now();
    cb(null, `${unique}-${base}${ext}`);
  },
});

// 2. Filter file berdasarkan field name
function templateAssetFilter(req, file, cb) {
  // Izinkan HTML, JSON, dan gambar untuk kedua field
  const allowedMimeTypes = [
    "text/html",
    "application/json",
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/jpg"
  ];
  const allowedExtensions = ['.html', '.json', '.jpg', '.jpeg', '.png', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedMimeTypes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error("File harus berupa HTML, JSON, atau gambar (JPG/PNG/WEBP)."), false);
  }
}

// 3. Middleware Multer disederhanakan menjadi .single()
export const handleTemplateUploads = multer({
  storage: templateStorage,
  fileFilter: templateAssetFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
}).fields([
  { name: 'thumbnail_file', maxCount: 1 },  // Untuk file desain (.json/.html)
  { name: 'thumbnail_image', maxCount: 1 } // Untuk file pratinjau gambar (.png/.jpg)
]);

// 1. Konfigurasi storage khusus untuk ikon kategori
const categoryIconStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const now = new Date();
    const yyyy = String(now.getFullYear());
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    // Simpan di folder yang berbeda
    const dest = path.join(
      process.cwd(),
      "public",
      "uploads",
      "category-icons",
      yyyy,
      mm
    );
    ensureDirSync(dest);
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    // Logika penamaan file bisa sama
    const ext = path.extname(file.originalname) || ".png";
    const base = path
      .basename(file.originalname, ext)
      .replace(/[^a-z0-9_-]/gi, "-")
      .toLowerCase();
    const unique = Date.now();
    cb(null, `${unique}-${base}${ext}`);
  },
});

// 2. Filter file khusus untuk ikon (misalnya, lebih ketat)
function categoryIconFilter(req, file, cb) {
  // Hanya izinkan PNG atau SVG untuk ikon, misalnya
  const ok = ["image/png", "image/svg+xml"].includes(file.mimetype);
  if (!ok) return cb(new Error("Ikon harus berupa gambar PNG/SVG."), false);
  cb(null, true);
}

// 3. Export middleware Multer yang baru
export const uploadCategoryIcon = multer({
  storage: categoryIconStorage,
  fileFilter: categoryIconFilter,
  limits: { fileSize: 200 * 1024 }, // Batas lebih kecil, misal 200 KB
});

// 1. Konfigurasi storage khusus untuk QR code pembayaran
const qrCodeStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const now = new Date();
    const yyyy = String(now.getFullYear());
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    // Simpan di folder yang berbeda dan spesifik
    const dest = path.join(process.cwd(), "public", "uploads", "payment-qrcodes", yyyy, mm);
    ensureDirSync(dest);
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    // Logika penamaan file bisa sama
    const ext = path.extname(file.originalname) || ".png";
    const base = path.basename(file.originalname, ext).replace(/[^a-z0-9_-]/gi, "-").toLowerCase();
    const unique = Date.now();
    cb(null, `${unique}-${base}${ext}`);
  }
});

// 2. Export middleware Multer yang baru untuk QR Code
export const uploadQrCode = multer({
  storage: qrCodeStorage,
  fileFilter: fileFilter, // Anda bisa pakai fileFilter yang sudah ada atau buat yang baru
  limits: { fileSize: 1 * 1024 * 1024 } // Batas, misal 1 MB
});

// --- MIDDLEWARE BARU UNTUK UPLOAD EXCEL ---

// Gunakan memoryStorage karena kita tidak perlu menyimpan filenya,
// cukup membacanya di memori lalu memprosesnya.
const excelStorage = multer.memoryStorage();

// Filter untuk memastikan hanya file spreadsheet yang diterima
function excelFileFilter(req, file, cb) {
  const allowedMimes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
    'text/csv', // .csv
  ];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Tipe file tidak valid. Hanya izinkan file Excel (.xlsx, .xls) atau .csv"), false);
  }
}

export const uploadExcel = multer({
  storage: excelStorage,
  fileFilter: excelFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // Batas 5 MB
});

// --- AKHIR MIDDLEWARE BARU ---