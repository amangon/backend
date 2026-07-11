import Order from "../models/Order.js";
import Product from "../models/Product.js";
import asyncHandler from "../middleware/asyncHandler.js";
import ErrorResponse from "../utils/ErrorResponse.js";

// @desc    Create a new order (validates stock, decrements it)
// @route   POST /api/orders
// @access  Private
export const createOrder = asyncHandler(async (req, res, next) => {
  const { items, shippingAddress, paymentMethod } = req.body;

  if (!items || items.length === 0) {
    return next(new ErrorResponse("Order must contain at least one item", 400));
  }

  let itemsPrice = 0;
  const orderItems = [];

  for (const item of items) {
    const product = await Product.findById(item.product);
    if (!product || !product.isActive) {
      return next(new ErrorResponse(`Product not found: ${item.product}`, 404));
    }
    if (product.stock < item.quantity) {
      return next(
        new ErrorResponse(`Insufficient stock for "${product.name}". Only ${product.stock} left.`, 400)
      );
    }
    const price = product.discountPrice > 0 ? product.discountPrice : product.price;
    itemsPrice += price * item.quantity;

    orderItems.push({
      product: product._id,
      name: product.name,
      image: product.images[0]?.url || "",
      price,
      quantity: item.quantity,
    });

    product.stock -= item.quantity;
    product.soldCount += item.quantity;
    await product.save();
  }

  const shippingPrice = itemsPrice >= 5000 ? 0 : 150;
  const taxPrice = Math.round(itemsPrice * 0.03 * 100) / 100; // 3% GST-style estimate
  const totalPrice = Math.round((itemsPrice + shippingPrice + taxPrice) * 100) / 100;

  const order = await Order.create({
    user: req.user.id,
    items: orderItems,
    shippingAddress,
    paymentMethod: paymentMethod || "cod",
    itemsPrice,
    shippingPrice,
    taxPrice,
    totalPrice,
    statusHistory: [{ status: "pending", note: "Order placed" }],
  });

  res.status(201).json({ success: true, message: "Order placed successfully", order });
});

// @desc    Get logged-in user's orders
// @route   GET /api/orders/my-orders
// @access  Private
export const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user.id }).sort("-createdAt");
  res.status(200).json({ success: true, count: orders.length, orders });
});

// @desc    Get single order (owner or admin)
// @route   GET /api/orders/:id
// @access  Private
export const getOrder = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id).populate("user", "name email");
  if (!order) return next(new ErrorResponse("Order not found", 404));

  if (order.user._id.toString() !== req.user.id && req.user.role !== "admin") {
    return next(new ErrorResponse("Not authorized to view this order", 403));
  }
  res.status(200).json({ success: true, order });
});

// @desc    Cancel an order (owner, only if not yet shipped)
// @route   PUT /api/orders/:id/cancel
// @access  Private
export const cancelOrder = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id);
  if (!order) return next(new ErrorResponse("Order not found", 404));

  if (order.user.toString() !== req.user.id && req.user.role !== "admin") {
    return next(new ErrorResponse("Not authorized to cancel this order", 403));
  }
  if (["shipped", "delivered", "cancelled"].includes(order.status)) {
    return next(new ErrorResponse(`Order cannot be cancelled once it is ${order.status}`, 400));
  }

  // restock items
  for (const item of order.items) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { stock: item.quantity, soldCount: -item.quantity },
    });
  }

  order.status = "cancelled";
  order.cancelledAt = new Date();
  order.cancelReason = req.body.reason || "Cancelled by user";
  order.statusHistory.push({ status: "cancelled", note: order.cancelReason });
  await order.save();

  res.status(200).json({ success: true, message: "Order cancelled", order });
});

// ---------- Admin: order management ----------

// @desc    Get all orders (admin)
// @route   GET /api/orders
// @access  Private/Admin
export const getOrders = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.search) {
    filter.orderNumber = { $regex: req.query.search, $options: "i" };
  }

  const [orders, total] = await Promise.all([
    Order.find(filter).populate("user", "name email").sort("-createdAt").skip(skip).limit(limit),
    Order.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    count: orders.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    orders,
  });
});

// @desc    Update order status (admin)
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
export const updateOrderStatus = asyncHandler(async (req, res, next) => {
  const { status, note } = req.body;
  const validStatuses = ["pending", "processing", "shipped", "delivered", "cancelled"];
  if (!validStatuses.includes(status)) {
    return next(new ErrorResponse("Invalid order status", 400));
  }

  const order = await Order.findById(req.params.id);
  if (!order) return next(new ErrorResponse("Order not found", 404));

  order.status = status;
  order.statusHistory.push({ status, note: note || "" });
  if (status === "delivered") {
    order.deliveredAt = new Date();
    order.paymentStatus = order.paymentMethod === "cod" ? "paid" : order.paymentStatus;
  }
  if (status === "cancelled" && order.cancelledAt === undefined) {
    order.cancelledAt = new Date();
  }

  await order.save();
  res.status(200).json({ success: true, message: "Order status updated", order });
});
