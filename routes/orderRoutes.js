import express from "express";
import {
  createOrder, getMyOrders, getOrder, cancelOrder, getOrders, updateOrderStatus,
} from "../controllers/orderController.js";
import { protect, authorize } from "../middleware/auth.js";
import { orderRules, runValidation } from "../middleware/validate.js";

const router = express.Router();

router.use(protect);

router.post("/", orderRules, runValidation, createOrder);
router.get("/my-orders", getMyOrders);
router.get("/:id", getOrder);
router.put("/:id/cancel", cancelOrder);

router.get("/", authorize("admin"), getOrders);
router.put("/:id/status", authorize("admin"), updateOrderStatus);

export default router;
