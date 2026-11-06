import { Router } from "express";
import { handleStripeWebhook } from "../controllers/webhook.controller.js";

const router: Router = Router();

router.get("/", (req, res) => {
  res.status(200).json({
    status: "ok webhook",
    uptime: process.uptime(),
    timestamp: Date.now(),
  });
});

router.post("/stripe", handleStripeWebhook);
router.post("/", handleStripeWebhook);

export default router;
