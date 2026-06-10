// controllers/dashboard/dashboardController.js
import User from "../../models/user.js";
import Invitation from "../../models/invitation.js";
import Transaksi from "../../models/transaksi.js";
import Template from "../../models/template.js";
import ReceiveInv from "../../models/receive_inv.js";
import Project from "../../models/project.js";
import { Sequelize } from "sequelize";
import { successResponse, errorResponse } from "../../helpers/response.js";

// ==========================
// Admin Dashboard Summary
// ==========================
export const adminSummary = async (req, res) => {
  try {
    // Total user
    const totalUsers = await User.count();
    const activeUsers = await User.count({ where: { isActive: true } });

    // Undangan
    const totalInvitations = await Invitation.count();
    const activeInvitations = await Invitation.count({
      where: { status: "aktif" },
    });

    // Total kunjungan (semua tamu / receiveInv)
    const totalVisits = await ReceiveInv.count();

    // Transaksi & Revenue
    const totalTransactions = await Transaksi.count({
      where: { status: "success" },
    });
    const totalRevenue = await Transaksi.sum("amount", {
      where: { status: "success" },
    });

    // Template
    const totalTemplates = await Template.count();

    // Statistik pengguna baru per bulan (6 bulan terakhir)
    const newUsersPerMonth = await User.sequelize.query(
      `
      SELECT DATE_TRUNC('month', "createdAt") as month, COUNT(*) as total
      FROM "users"
      GROUP BY month
      ORDER BY month DESC
      LIMIT 6;
      `,
      { type: User.sequelize.QueryTypes.SELECT }
    );

    // Statistik transaksi per bulan (6 bulan terakhir)
    const transactionsPerMonth = await Transaksi.sequelize.query(
      `
      SELECT DATE_TRUNC('month', "createdAt") as month, COUNT(*) as total
      FROM "transaksis"
      WHERE status = 'success'
      GROUP BY month
      ORDER BY month DESC
      LIMIT 6;
      `,
      { type: Transaksi.sequelize.QueryTypes.SELECT }
    );

    // Paket populer (ambil 3 paling banyak)
    const paketPopuler = await Transaksi.findAll({
      attributes: [
        "subscription_name",
        [Sequelize.fn("COUNT", Sequelize.col("subscription_name")), "total"],
      ],
      where: { status: "success" },
      group: ["subscription_name"],
      order: [[Sequelize.literal("total"), "DESC"]],
      limit: 3,
    });

    return successResponse(res, 200, "Dashboard data retrieved successfully", {
      totalUsers,
      activeUsers,
      totalInvitations,
      activeInvitations,
      totalVisits,
      totalTransactions,
      totalRevenue: totalRevenue || 0,
      totalTemplates,
      newUsersPerMonth,
      transactionsPerMonth,
      paketPopuler,
    });
  } catch (error) {
    console.error("Error in adminSummary:", error);
    return errorResponse(res, 500, "Gagal mengambil data dashboard admin.");
  }
};

// ==========================
// User Dashboard Summary
// ==========================
export const userSummary = async (req, res) => {
  try {
    const userId = req.user.id; // dari token JWT

    // Undangan milik user (melalui Project)
    const totalInvitations = await Invitation.count({
      include: [{
        model: Project,
        as: "project",
        required: true,
        where: { created_by: userId }
      }]
    });
    
    const activeInvitations = await Invitation.count({
      where: { status: "aktif" },
      include: [{
        model: Project,
        as: "project",
        required: true,
        where: { created_by: userId }
      }]
    });

    // Total pengunjung = semua tamu (receiveInv)
    const totalVisitors = await ReceiveInv.count({
      include: [
        {
          model: Invitation,
          as: "invitation",
          required: true,
          include: [{
            model: Project,
            as: "project",
            required: true,
            where: { created_by: userId }
          }]
        },
      ],
    });

    // Total RSVP = tamu dengan status accepted
    const totalRSVP = await ReceiveInv.count({
      where: { status: "accepted" },
      include: [
        {
          model: Invitation,
          as: "invitation",
          required: true,
          include: [{
            model: Project,
            as: "project",
            required: true,
            where: { created_by: userId }
          }]
        },
      ],
    });

    // Aktivitas terbaru (5 undangan terakhir user)
    const recentActivities = await Invitation.findAll({
      include: [{
        model: Project,
        as: "project",
        required: true,
        where: { created_by: userId }
      }],
      order: [["createdAt", "DESC"]],
      limit: 5,
    });

    // Statistik pengunjung & RSVP per hari (7 hari terakhir)
    const visitsAndRSVP = await ReceiveInv.sequelize.query(
      `
      SELECT 
        DATE("ReceiveInvs"."createdAt") as day,
        COUNT(*) as visitors,
        COUNT(CASE WHEN "ReceiveInvs"."status" = 'accepted' THEN 1 END) as rsvp
      FROM "receive_invs" AS "ReceiveInvs"
      INNER JOIN "invitations" AS "invitation" 
        ON "ReceiveInvs"."invitation_id" = "invitation"."id"
      INNER JOIN "projects" AS "project"
        ON "invitation"."project_id" = "project"."id"
      WHERE "project"."created_by" = :userId
        AND "ReceiveInvs"."createdAt" >= NOW() - INTERVAL '7 days'
      GROUP BY day
      ORDER BY day ASC;
      `,
      {
        replacements: { userId },
        type: ReceiveInv.sequelize.QueryTypes.SELECT,
      }
    );

    res.json({
      success: true,
      data: {
        totalInvitations,
        activeInvitations,
        totalVisitors,
        totalRSVP,
        recentActivities,
        visitsAndRSVP,
      },
    });
  } catch (error) {
    console.error("Error in userSummary:", error);
    res.status(500).json({
      success: false,
      message: "Gagal mengambil data dashboard user.",
    });
  }
};
