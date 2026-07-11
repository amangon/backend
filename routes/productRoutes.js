import express from "express";
import {
  getProducts, getFeaturedProducts, getBestSellers, getNewArrivals,
  getProduct, getRelatedProducts, createProduct, updateProduct,
  deleteProduct, updateStock, addReview,
} from "../controllers/productController.js";
import { protect, authorize } from "../middleware/auth.js";
import { productRules, runValidation } from "../middleware/validate.js";
import upload from "../middleware/upload.js";

const router = express.Router();

router.get("/", getProducts);
router.get("/featured", getFeaturedProducts);
router.get("/best-sellers", getBestSellers);
router.get("/new-arrivals", getNewArrivals);
router.get("/:idOrSlug", getProduct);
router.get("/:id/related", getRelatedProducts);

router.post("/:id/reviews", protect, addReview);

router.post("/", protect, authorize("admin"), upload.array("images", 8), productRules, runValidation, createProduct);
router.put("/:id", protect, authorize("admin"), upload.array("images", 8), updateProduct);
router.delete("/:id", protect, authorize("admin"), deleteProduct);
router.patch("/:id/stock", protect, authorize("admin"), updateStock);

export default router;
