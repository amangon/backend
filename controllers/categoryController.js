import Category from "../models/Category.js";
import Product from "../models/Product.js";
import asyncHandler from "../middleware/asyncHandler.js";
import ErrorResponse from "../utils/ErrorResponse.js";
import { uploadBufferToCloudinary, deleteFromCloudinary } from "../config/cloudinary.js";

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
export const getCategories = asyncHandler(async (req, res) => {
  const filter = req.query.all === "true" ? {} : { isActive: true };
  const categories = await Category.find(filter).sort("sortOrder name");
  res.status(200).json({ success: true, count: categories.length, categories });
});

// @desc    Get single category by id or slug
// @route   GET /api/categories/:idOrSlug
// @access  Public
export const getCategory = asyncHandler(async (req, res, next) => {
  const { idOrSlug } = req.params;
  const category = await Category.findOne({
    $or: [{ _id: idOrSlug.match(/^[0-9a-fA-F]{24}$/) ? idOrSlug : null }, { slug: idOrSlug }],
  });
  if (!category) return next(new ErrorResponse("Category not found", 404));
  res.status(200).json({ success: true, category });
});

// @desc    Create category
// @route   POST /api/categories
// @access  Private/Admin
export const createCategory = asyncHandler(async (req, res, next) => {
  const { name, description, isActive, sortOrder } = req.body;

  const category = new Category({ name, description, isActive, sortOrder });

  if (req.file) {
    const result = await uploadBufferToCloudinary(req.file.buffer, {
      folder: "luxury-jewellery/categories",
    });
    category.image = { url: result.secure_url, publicId: result.public_id };
  }

  await category.save();
  res.status(201).json({ success: true, message: "Category created", category });
});

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private/Admin
export const updateCategory = asyncHandler(async (req, res, next) => {
  const category = await Category.findById(req.params.id);
  if (!category) return next(new ErrorResponse("Category not found", 404));

  const { name, description, isActive, sortOrder } = req.body;
  if (name) category.name = name;
  if (description !== undefined) category.description = description;
  if (typeof isActive === "boolean") category.isActive = isActive;
  if (sortOrder !== undefined) category.sortOrder = sortOrder;

  if (req.file) {
    if (category.image?.publicId) await deleteFromCloudinary(category.image.publicId);
    const result = await uploadBufferToCloudinary(req.file.buffer, {
      folder: "luxury-jewellery/categories",
    });
    category.image = { url: result.secure_url, publicId: result.public_id };
  }

  await category.save();
  res.status(200).json({ success: true, message: "Category updated", category });
});

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private/Admin
export const deleteCategory = asyncHandler(async (req, res, next) => {
  const category = await Category.findById(req.params.id);
  if (!category) return next(new ErrorResponse("Category not found", 404));

  const productCount = await Product.countDocuments({ category: category._id });
  if (productCount > 0) {
    return next(
      new ErrorResponse(
        `Cannot delete category with ${productCount} associated product(s). Reassign or delete them first.`,
        400
      )
    );
  }

  if (category.image?.publicId) await deleteFromCloudinary(category.image.publicId);
  await category.deleteOne();
  res.status(200).json({ success: true, message: "Category deleted" });
});
