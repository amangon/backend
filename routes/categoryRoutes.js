import express from "express";
import {
  getCategories, getCategory, createCategory, updateCategory, deleteCategory,
} from "../controllers/categoryController.js";
import { protect, authorize } from "../middleware/auth.js";
import { categoryRules, runValidation } from "../middleware/validate.js";
import upload from "../middleware/upload.js";

const router = express.Router();

router.get("/", getCategories);
router.get("/:idOrSlug", getCategory);

router.post("/", protect, authorize("admin"), upload.single("image"), categoryRules, runValidation, createCategory);
router.put("/:id", protect, authorize("admin"), upload.single("image"), updateCategory);
router.delete("/:id", protect, authorize("admin"), deleteCategory);

export default router;
