import Order from "../models/Order.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import asyncHandler from "../middleware/asyncHandler.js";

// @desc    Get admin dashboard summary stats
// @route   GET /api/dashboard/summary
// @access  Private/Admin
export const getSummary = asyncHandler(async (req, res) => {
  const [totalUsers, totalProducts, totalOrders, revenueAgg, lowStockCount, pendingOrders] =
    await Promise.all([
      User.countDocuments({ role: "user" }),
      Product.countDocuments(),
      Order.countDocuments(),
      Order.aggregate([
        { $match: { status: { $ne: "cancelled" } } },
        { $group: { _id: null, total: { $sum: "$totalPrice" } } },
      ]),
      Product.countDocuments({ stock: { $lte: 5, $gt: 0 } }),
      Order.countDocuments({ status: "pending" }),
    ]);

  res.status(200).json({
    success: true,
    summary: {
      totalUsers,
      totalProducts,
      totalOrders,
      totalRevenue: revenueAgg[0]?.total || 0,
      lowStockCount,
      pendingOrders,
    },
  });
});

// @desc    Sales analytics over time (daily revenue, last N days)
// @route   GET /api/dashboard/sales-analytics
// @access  Private/Admin
export const getSalesAnalytics = asyncHandler(async (req, res) => {
  const days = parseInt(req.query.days, 10) || 30;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const salesByDay = await Order.aggregate([
    { $match: { createdAt: { $gte: startDate }, status: { $ne: "cancelled" } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        revenue: { $sum: "$totalPrice" },
        orders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const ordersByStatus = await Order.aggregate([
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);

  const topProducts = await Product.find()
    .sort("-soldCount")
    .limit(5)
    .select("name soldCount price images");

  res.status(200).json({
    success: true,
    analytics: { salesByDay, ordersByStatus, topProducts },
  });
});
