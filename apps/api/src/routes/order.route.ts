import { Router } from "express";
import {
  getOrderChart,
  getOrders,
  getUserOrders,
} from "../controllers/order.controller.js";
import { shouldBeAdmin, shouldBeUser } from "../middleware/authMiddleware.js";

const router: Router = Router();

// Support both /user-orders and /orders
router.get("/user-orders", shouldBeUser, getUserOrders);
router.get("/orders", shouldBeAdmin, getOrders);
router.get("/order-chart", shouldBeAdmin, getOrderChart);
router.get("/", shouldBeAdmin, getOrders);

export default router;
