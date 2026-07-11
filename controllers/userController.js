import User from "../models/User.js";
import Product from "../models/Product.js";
import asyncHandler from "../middleware/asyncHandler.js";
import ErrorResponse from "../utils/ErrorResponse.js";
import { uploadBufferToCloudinary, deleteFromCloudinary } from "../config/cloudinary.js";

// @desc    Update logged-in user's profile
// @route   PUT /api/users/profile
// @access  Private
export const updateProfile = asyncHandler(async (req, res, next) => {
  const { name, phone } = req.body;
  const user = await User.findById(req.user.id);

  if (name) user.name = name;
  if (phone) user.phone = phone;

  if (req.file) {
    if (user.avatar?.publicId) await deleteFromCloudinary(user.avatar.publicId);
    const result = await uploadBufferToCloudinary(req.file.buffer, { folder: "luxury-jewellery/avatars" });
    user.avatar = { url: result.secure_url, publicId: result.public_id };
  }

  await user.save();
  res.status(200).json({ success: true, message: "Profile updated", user: user.toSafeObject() });
});

// @desc    Change password
// @route   PUT /api/users/change-password
// @access  Private
export const changePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user.id).select("+password");

  const isMatch = await user.matchPassword(currentPassword);
  if (!isMatch) {
    return next(new ErrorResponse("Current password is incorrect", 400));
  }

  user.password = newPassword;
  await user.save();

  res.status(200).json({ success: true, message: "Password changed successfully" });
});

// @desc    Add / update a shipping address
// @route   POST /api/users/addresses
// @access  Private
export const addAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (req.body.isDefault) {
    user.addresses.forEach((a) => (a.isDefault = false));
  }
  user.addresses.push(req.body);
  await user.save();
  res.status(201).json({ success: true, addresses: user.addresses });
});

// @desc    Update an address
// @route   PUT /api/users/addresses/:addressId
// @access  Private
export const updateAddress = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  const address = user.addresses.id(req.params.addressId);
  if (!address) return next(new ErrorResponse("Address not found", 404));

  if (req.body.isDefault) {
    user.addresses.forEach((a) => (a.isDefault = false));
  }
  Object.assign(address, req.body);
  await user.save();
  res.status(200).json({ success: true, addresses: user.addresses });
});

// @desc    Delete an address
// @route   DELETE /api/users/addresses/:addressId
// @access  Private
export const deleteAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  user.addresses = user.addresses.filter((a) => a._id.toString() !== req.params.addressId);
  await user.save();
  res.status(200).json({ success: true, addresses: user.addresses });
});

// @desc    Get wishlist
// @route   GET /api/users/wishlist
// @access  Private
export const getWishlist = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).populate({
    path: "wishlist",
    match: { isActive: true },
    populate: { path: "category", select: "name slug" },
  });
  res.status(200).json({ success: true, wishlist: user.wishlist });
});

// @desc    Toggle a product in the wishlist
// @route   POST /api/users/wishlist/:productId
// @access  Private
export const toggleWishlist = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.productId);
  if (!product) return next(new ErrorResponse("Product not found", 404));

  const user = await User.findById(req.user.id);
  const exists = user.wishlist.some((id) => id.toString() === req.params.productId);

  if (exists) {
    user.wishlist = user.wishlist.filter((id) => id.toString() !== req.params.productId);
  } else {
    user.wishlist.push(req.params.productId);
  }
  await user.save();

  res.status(200).json({
    success: true,
    inWishlist: !exists,
    message: exists ? "Removed from wishlist" : "Added to wishlist",
  });
});

// ---------- Admin: user management ----------

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
export const getUsers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.search) {
    filter.$or = [
      { name: { $regex: req.query.search, $options: "i" } },
      { email: { $regex: req.query.search, $options: "i" } },
    ];
  }
  if (req.query.role) filter.role = req.query.role;

  const [users, total] = await Promise.all([
    User.find(filter).sort("-createdAt").skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    count: users.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    users,
  });
});

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private/Admin
export const getUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) return next(new ErrorResponse("User not found", 404));
  res.status(200).json({ success: true, user });
});

// @desc    Update user role / active status (admin)
// @route   PUT /api/users/:id
// @access  Private/Admin
export const updateUser = asyncHandler(async (req, res, next) => {
  const { role, isActive, name, phone } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) return next(new ErrorResponse("User not found", 404));

  if (role) user.role = role;
  if (typeof isActive === "boolean") user.isActive = isActive;
  if (name) user.name = name;
  if (phone) user.phone = phone;

  await user.save();
  res.status(200).json({ success: true, message: "User updated", user });
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
export const deleteUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) return next(new ErrorResponse("User not found", 404));
  if (user._id.toString() === req.user.id) {
    return next(new ErrorResponse("You cannot delete your own admin account", 400));
  }
  await user.deleteOne();
  res.status(200).json({ success: true, message: "User deleted" });
});
