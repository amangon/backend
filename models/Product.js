import mongoose from "mongoose";
import slugify from "slugify";

const imageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
  },
  { _id: false }
);

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, trim: true, maxlength: 1000 },
  },
  { timestamps: true }
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      maxlength: 120,
    },
    slug: { type: String, unique: true, index: true },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
    shortDescription: { type: String, trim: true, maxlength: 200 },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category is required"],
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: 0,
    },
    discountPrice: { type: Number, min: 0, default: 0 },
    sku: { type: String, unique: true, sparse: true, trim: true },
    material: { type: String, trim: true },
    gemstone: { type: String, trim: true },
    weight: { type: String, trim: true },
    stock: {
      type: Number,
      required: [true, "Stock quantity is required"],
      min: 0,
      default: 0,
    },
    images: {
      type: [imageSchema],
      validate: {
        validator: (arr) => arr.length > 0,
        message: "At least one product image is required",
      },
    },
    isFeatured: { type: Boolean, default: false },
    isBestSeller: { type: Boolean, default: false },
    isNewArrival: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    ratingsAverage: { type: Number, default: 0, min: 0, max: 5 },
    ratingsCount: { type: Number, default: 0 },
    reviews: [reviewSchema],
    soldCount: { type: Number, default: 0 },
    tags: [{ type: String, trim: true }],
  },
  { timestamps: true }
);

productSchema.index({ name: "text", description: "text", tags: "text" });

productSchema.pre("validate", function (next) {
  if (this.name) {
    this.slug =
      slugify(this.name, { lower: true, strict: true }) +
      "-" +
      Math.random().toString(36).slice(2, 7);
  }
  next();
});

productSchema.virtual("inStock").get(function () {
  return this.stock > 0;
});

productSchema.virtual("effectivePrice").get(function () {
  return this.discountPrice && this.discountPrice > 0
    ? this.discountPrice
    : this.price;
});

productSchema.set("toJSON", { virtuals: true });
productSchema.set("toObject", { virtuals: true });

productSchema.methods.recalculateRatings = function () {
  if (this.reviews.length === 0) {
    this.ratingsAverage = 0;
    this.ratingsCount = 0;
    return;
  }
  const sum = this.reviews.reduce((acc, r) => acc + r.rating, 0);
  this.ratingsAverage = Math.round((sum / this.reviews.length) * 10) / 10;
  this.ratingsCount = this.reviews.length;
};

export default mongoose.model("Product", productSchema);
