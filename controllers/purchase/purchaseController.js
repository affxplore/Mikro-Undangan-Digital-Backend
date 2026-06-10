// import { Transaction, User, Subscription, Template } from '../../models/index.js';
import Transaction from '../../models/transaction.js';
import User from '../../models/user.js';
import Subscription from '../../models/subscription.js';
import Template from '../../models/template.js';
import sequelize from '../../config/database.js';
import { successResponse, errorResponse } from '../../helpers/response.js';
// Fungsi untuk membeli atau upgrade langganan
export const purchaseSubscription = async (req, res) => {
    try {
        const { subscription_id } = req.body;
        const userId = req.user.id;

        const subscription = await Subscription.findByPk(subscription_id);
        if (!subscription) {
            return errorResponse(res, 404, "Paket langganan tidak ditemukan.");
        }

        // 1. Buat catatan transaksi
        await Transaction.create({
            user_id: userId,
            amount: subscription.price, // Asumsi ada kolom 'price' di model Subscription
            status: 'success',
            description: `Pembelian langganan: ${subscription.name}`,
            purchase_type: 'SUBSCRIPTION',
            related_id: subscription.id
        });

        // 2. Update status langganan pengguna
        const user = await User.findByPk(userId);
        user.subscription = subscription.name; // atau subscription.level
        await user.save();
        
        return successResponse(res, 200, `Langganan ${subscription.name} berhasil diaktifkan.`, { subscription: subscription.name });

    } catch (error) {
        return errorResponse(res, 500, error.message);
    }
};

// Fungsi untuk membeli template premium
export const purchaseTemplate = async (req, res) => {
    try {
        const { template_id } = req.body;
        const userId = req.user.id;

        const template = await Template.findByPk(template_id);
        if (!template || !template.is_premium) { // Asumsi ada kolom is_premium
             return errorResponse(res, 404, "Template premium tidak ditemukan.");
        }
        
        // 1. Buat catatan transaksi
        await Transaction.create({
            user_id: userId,
            amount: template.price, // Asumsi ada kolom 'price'
            status: 'success',
            description: `Pembelian template: ${template.name}`,
            purchase_type: 'TEMPLATE',
            related_id: template.id
        });

        // 2. Berikan akses template ke user (misal: melalui tabel junction UserUnlockedTemplates)
        // ... (logika untuk memberikan akses) ...

        return successResponse(res, 200, `Template ${template.name} berhasil dibeli.`, { template: template.name });

    } catch (error) {
         return errorResponse(res, 500, error.message);
    }
};