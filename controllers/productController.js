import Product from "../models/Product.js";
import asyncHandler from "../middleware/asyncHandler.js";
import ErrorResponse from "../utils/ErrorResponse.js";
import ApiFeatures from "../utils/apiFeatures.js";
import { uploadBufferToCloudinary, deleteFromCloudinary } from "../config/cloudinary.js";

// @desc    Get all products (search, filter, sort, paginate)
// @route   GET /api/products
// @access  Public
export const getProducts = asyncHandler(async (req, res) => {
  const baseFilter = req.query.includeInactive === "true" ? {} : { isActive: true };

  const features = new ApiFeatures(Product.find(baseFilter).populate("category", "name slug"), req.query)
    .search()
    .filter()
    .sort()
    .limitFields();

  const total = await Product.countDocuments(features.query.getFilter());
  features.paginate();

  const products = await features.query;

  res.status(200).json({
    success: true,
    count: products.length,
    total,
    page: features.pagination.page,
    pages: Math.ceil(total / features.pagination.limit),
    products,
  });
});

// @desc    Get featured products
// @route   GET /api/products/featured
// @access  Public
export const getFeaturedProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ isFeatured: true, isActive: true })
    .populate("category", "name slug")
    .limit(8);
  res.status(200).json({ success: true, count: products.length, products });
});

// @desc    Get best sellers
// @route   GET /api/products/best-sellers
// @access  Public
export const getBestSellers = asyncHandler(async (req, res) => {
  const products = await Product.find({ isBestSeller: true, isActive: true })
    .populate("category", "name slug")
    .sort("-soldCount")
    .limit(8);
  res.status(200).json({ success: true, count: products.length, products });
});

// @desc    Get new arrivals
// @route   GET /api/products/new-arrivals
// @access  Public
export const getNewArrivals = asyncHandler(async (req, res) => {
  const products = await Product.find({ isNewArrival: true, isActive: true })
    .populate("category", "name slug")
    .sort("-createdAt")
    .limit(8);
  res.status(200).json({ success: true, count: products.length, products });
});

// @desc    Get single product by id or slug
// @route   GET /api/products/:idOrSlug
// @access  Public
export const getProduct = asyncHandler(async (req, res, next) => {
  const { idOrSlug } = req.params;
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(idOrSlug);

  const product = await Product.findOne(
    isObjectId ? { _id: idOrSlug } : { slug: idOrSlug }
  ).populate("category", "name slug");

  if (!product) return next(new ErrorResponse("Product not found", 404));
  res.status(200).json({ success: true, product });
});

// @desc    Get related products (same category)
// @route   GET /api/products/:id/related
// @access  Public
export const getRelatedProducts = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  if (!product) return next(new ErrorResponse("Product not found", 404));

  const related = await Product.find({
    category: product.category,
    _id: { $ne: product._id },
    isActive: true,
  })
    .limit(4)
    .populate("category", "name slug");

  res.status(200).json({ success: true, products: related });
});

// @desc    Create product (with multiple image upload)
// @route   POST /api/products
// @access  Private/Admin

export const createProduct = asyncHandler(async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return next(
        new ErrorResponse("At least one product image is required", 400)
      );
    }

    const uploads = await Promise.all(
      req.files.map((file) =>
        uploadBufferToCloudinary(file.buffer, {
          folder: "luxury-jewellery/products",
        })
      )
    );

    const images = uploads.map((r) => ({
      url: r.secure_url,
      publicId: r.public_id,
    }));

    const {
      name,
      description,
      shortDescription,
      category,
      price,
      discountPrice,
      sku,
      material,
      gemstone,
      weight,
      stock,
      isFeatured,
      isBestSeller,
      isNewArrival,
      tags,
    } = req.body;

    const product = await Product.create({
      name,
      description,
      shortDescription,
      category,
      price,
      discountPrice: discountPrice || 0,
      sku,
      material,
      gemstone,
      weight,
      stock,
      images,

      isFeatured:
        isFeatured === "true" || isFeatured === true,

      isBestSeller:
        isBestSeller === "true" || isBestSeller === true,

      isNewArrival:
        isNewArrival === "true" || isNewArrival === true,

      tags: tags
        ? Array.isArray(tags)
          ? tags
          : tags.split(",").map((t) => t.trim())
        : [],
    });


    res.status(201).json({
      success: true,
      message: "Product created",
      product,
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});
  
// @desc    Update product (optionally add more images)
// @route   PUT /api/products/:id
// @access  Private/Admin
export const updateProduct = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  if (!product) return next(new ErrorResponse("Product not found", 404));

  const fields = [
    "name", "description", "shortDescription", "category", "price",
    "discountPrice", "sku", "material", "gemstone", "weight", "stock",
  ];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) product[f] = req.body[f];
  });

  ["isFeatured", "isBestSeller", "isNewArrival", "isActive"].forEach((f) => {
    if (req.body[f] !== undefined) {
      product[f] = req.body[f] === "true" || req.body[f] === true;
    }
  });

  if (req.body.tags !== undefined) {
    product.tags = Array.isArray(req.body.tags)
      ? req.body.tags
      : req.body.tags.split(",").map((t) => t.trim());
  }

  // Remove specific existing images by publicId (sent as JSON array string)
  if (req.body.removeImages) {
    const toRemove = JSON.parse(req.body.removeImages);
    for (const publicId of toRemove) {
      await deleteFromCloudinary(publicId);
    }
    product.images = product.images.filter((img) => !toRemove.includes(img.publicId));
  }

  // Add newly uploaded images
  if (req.files && req.files.length > 0) {
    const uploads = await Promise.all(
      req.files.map((file) =>
        uploadBufferToCloudinary(file.buffer, { folder: "luxury-jewellery/products" })
      )
    );
    const newImages = uploads.map((r) => ({ url: r.secure_url, publicId: r.public_id }));
    product.images.push(...newImages);
  }

  if (product.images.length === 0) {
    return next(new ErrorResponse("Product must have at least one image", 400));
  }

  await product.save();
  res.status(200).json({ success: true, message: "Product updated", product });
});

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private/Admin
export const deleteProduct = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  if (!product) return next(new ErrorResponse("Product not found", 404));

  await Promise.all(product.images.map((img) => deleteFromCloudinary(img.publicId)));
  await product.deleteOne();

  res.status(200).json({ success: true, message: "Product deleted" });
});

// @desc    Update stock quantity directly
// @route   PATCH /api/products/:id/stock
// @access  Private/Admin
export const updateStock = asyncHandler(async (req, res, next) => {
  const { stock } = req.body;
  if (stock === undefined || stock < 0) {
    return next(new ErrorResponse("A valid non-negative stock value is required", 400));
  }
  const product = await Product.findByIdAndUpdate(
    req.params.id,
    { stock },
    { new: true, runValidators: true }
  );
  if (!product) return next(new ErrorResponse("Product not found", 404));
  res.status(200).json({ success: true, message: "Stock updated", product });
});

// @desc    Add a review to a product
// @route   POST /api/products/:id/reviews
// @access  Private
export const addReview = asyncHandler(async (req, res, next) => {
  const { rating, comment } = req.body;
  const product = await Product.findById(req.params.id);
  if (!product) return next(new ErrorResponse("Product not found", 404));

  const alreadyReviewed = product.reviews.find(
    (r) => r.user.toString() === req.user.id
  );
  if (alreadyReviewed) {
    return next(new ErrorResponse("You have already reviewed this product", 400));
  }

  product.reviews.push({
    user: req.user.id,
    name: req.user.name,
    rating: Number(rating),
    comment,
  });
  product.recalculateRatings();
  await product.save();

  res.status(201).json({ success: true, message: "Review added" });
});
