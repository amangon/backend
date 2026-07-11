import express from "express";
import { getSummary, getSalesAnalytics } from "../controllers/dashboardController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

router.use(protect, authorize("admin"));
router.get("/summary", getSummary);
router.get("/sales-analytics", getSalesAnalytics);

export default router;
