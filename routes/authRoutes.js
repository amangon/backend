import express from "express";
import { register, login, logout, getMe } from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";
import { registerRules, loginRules, runValidation } from "../middleware/validate.js";

const router = express.Router();

router.post("/register", registerRules, runValidation, register);
router.post("/login", loginRules, runValidation, login);
router.post("/logout", protect, logout);
router.get("/me", protect, getMe);

export default router;
