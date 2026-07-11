import express from "express";
import {
  updateProfile, changePassword, addAddress, updateAddress, deleteAddress,
  getWishlist, toggleWishlist, getUsers, getUser, updateUser, deleteUser,
} from "../controllers/userController.js";
import { protect, authorize } from "../middleware/auth.js";
import { changePasswordRules, runValidation } from "../middleware/validate.js";
import upload from "../middleware/upload.js";

const router = express.Router();

router.use(protect);

router.put("/profile", upload.single("avatar"), updateProfile);
router.put("/change-password", changePasswordRules, runValidation, changePassword);

router.post("/addresses", addAddress);
router.put("/addresses/:addressId", updateAddress);
router.delete("/addresses/:addressId", deleteAddress);

router.get("/wishlist", getWishlist);
router.post("/wishlist/:productId", toggleWishlist);

// Admin only
router.get("/", authorize("admin"), getUsers);
router.get("/:id", authorize("admin"), getUser);
router.put("/:id", authorize("admin"), updateUser);
router.delete("/:id", authorize("admin"), deleteUser);

export default router;
