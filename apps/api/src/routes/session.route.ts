import { Router } from "express";
import {
  createCheckoutSession,
  getSession,
} from "../controllers/session.controller.js";
import { shouldBeUser } from "../middleware/authMiddleware.js";

const router: Router = Router();

router.post("/create-checkout-session", shouldBeUser, createCheckoutSession);
router.get("/:session_id", getSession);

export default router;
