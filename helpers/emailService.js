// Lokasi: helpers/emailService.js (File Baru)
import nodemailer from 'nodemailer';
import 'dotenv/config';

// Transport options with sensible timeouts and optional debug
const transportOptions = {
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT, 10),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    // timeouts (ms) - can be overridden via env vars
    connectionTimeout: parseInt(process.env.EMAIL_CONNECTION_TIMEOUT || '10000', 10),
    greetingTimeout: parseInt(process.env.EMAIL_GREETING_TIMEOUT || '10000', 10),
    socketTimeout: parseInt(process.env.EMAIL_SOCKET_TIMEOUT || '10000', 10),
    // enable verbose logs when needed
    logger: process.env.EMAIL_DEBUG === 'true',
    debug: process.env.EMAIL_DEBUG === 'true',
    tls: {
        // allow disabling cert verification via env (default = true)
        rejectUnauthorized: process.env.EMAIL_TLS_REJECT_UNAUTHORIZED !== 'false',
    },
};

const transporter = nodemailer.createTransport(transportOptions);

// Verify transporter at startup so network/SPI issues are logged early
(async () => {
    try {
        await transporter.verify();
        console.log('Email transporter verified (SMTP reachable)');
    } catch (err) {
        console.warn('Email transporter verification failed:', err && err.code ? `${err.code} - ${err.message}` : err);
    }
})();

// export const sendVerificationEmail = async (toEmail, otpCode) => {
//     const mailOptions = {
//         from: `"Mikro Undangan" <${process.env.EMAIL_USER}>`,
//         to: toEmail,
//         subject: 'Kode Verifikasi Akun',
//         html: `<p>Kode verifikasi Anda adalah: <b>${otpCode}</b>. Kode ini berlaku selama 15 menit.</p>`,
//     };

//     try {
//         await transporter.sendMail(mailOptions);
//         console.log(`Email verifikasi terkirim ke ${toEmail}`);
//     } catch (error) {
//         console.error(`Gagal mengirim email ke ${toEmail}:`, error);
//     }
// };

/**
 * 1. FUNGSI GENERIK PENGIRIM EMAIL (BARU)
 * Fungsi ini menerima semua opsi email secara dinamis.
 */
const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

/**
 * Generic send with simple retry/backoff.
 * - mailOptions: nodemailer mail options
 * - maxRetries: number of retries on failure (default: 1 retry)
 */
export const sendEmail = async (mailOptions, maxRetries = parseInt(process.env.EMAIL_MAX_RETRIES || '1', 10)) => {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const info = await transporter.sendMail(mailOptions);
            console.log(`Email terkirim ke: ${mailOptions.to} (messageId=${info.messageId})`);
            return info;
        } catch (error) {
            console.error(`Gagal mengirim email ke ${mailOptions.to} (attempt ${attempt + 1}):`, error);
            const isLast = attempt === maxRetries;
            if (isLast) {
                const e = new Error('Gagal mengirim email.');
                e.cause = error;
                throw e;
            }
            // simple exponential backoff
            await sleep(2000 * (attempt + 1));
        }
    }
};

/**
 * 2. FUNGSI OTP (DIPERBARUI)
 * Sekarang hanya menyiapkan opsi dan memanggil fungsi generik.
 */
export const sendVerificationEmail = async (toEmail, otpCode) => {
    const mailOptions = {
        from: `"Mikro Undangan" <${process.env.EMAIL_USER}>`,
        to: toEmail,
        subject: 'Kode Verifikasi Akun Anda',
        html: `<p>Kode verifikasi Anda adalah: <b>${otpCode}</b>. Kode ini berlaku 15 menit.</p>`,
    };
    return sendEmail(mailOptions);
};

/**
 * 3. FUNGSI RESET PASSWORD (BARU)
 * Menyiapkan opsi khusus untuk email reset password.
 */
export const sendResetPasswordEmail = async (toEmail, resetLink) => {
    const mailOptions = {
        from: `"Mikro Undangan" <${process.env.EMAIL_USER}>`,
        to: toEmail,
        subject: 'Link Reset Password Akun Anda',
        html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                <h2>Reset Password Anda</h2>
                <p>Anda menerima email ini karena ada permintaan untuk mereset password akun Anda.</p>
                <p>Silakan klik link di bawah ini untuk melanjutkan:</p>
                <p style="margin: 20px 0;">
                    <a 
                        href="${resetLink}" 
                        target="_blank" 
                        style="background-color: #007bff; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px;"
                    >
                        Reset Password Saya
                    </a>
                </p>
                
                <p style="color: #888; font-size: 12px;">
                    Link ini hanya akan berlaku selama <b>15 menit</b>.
                </p>
                <p>Jika Anda tidak merasa meminta ini, abaikan saja email ini.</p>
            </div>
        `,
    };
    return sendEmail(mailOptions);
};