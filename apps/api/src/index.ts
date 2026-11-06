import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load root-level .env file
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import express, { Express, NextFunction, Request, Response } from "express";
import cors from "cors";
import { clerkMiddleware } from "@clerk/express";
import { shouldBeUser } from "./middleware/authMiddleware.js";
import productRouter from "./routes/product.route.js";
import categoryRouter from "./routes/category.route.js";
import orderRouter from "./routes/order.route.js";
import sessionRouter from "./routes/session.route.js";
import webhookRouter from "./routes/webhook.route.js";
import userRouter from "./routes/user.route.js";

const app: Express = express();

app.use(
  cors({
    origin: ["http://localhost:3002", "http://localhost:3003"],
    credentials: true,
  })
);

// Health Check endpoint (always accessible)
app.get("/health", (req: Request, res: Response) => {
  return res.status(200).json({
    status: "ok",
    service: "unified-api",
    uptime: process.uptime(),
    timestamp: Date.now(),
  });
});

// Raw body parser for Stripe webhooks before general JSON parser
app.use("/webhooks", express.raw({ type: "application/json" }), webhookRouter);

// JSON parser for all other routes
app.use(express.json());

// Clerk middleware only if a real key is provided
const isClerkConfigured =
  process.env.CLERK_PUBLISHABLE_KEY &&
  !process.env.CLERK_PUBLISHABLE_KEY.includes("your_clerk") &&
  process.env.CLERK_PUBLISHABLE_KEY.length > 30;

if (isClerkConfigured) {
  app.use(clerkMiddleware());
} else {
  console.log("ℹ️ Running in development mode with simulated auth (Set real CLERK keys in .env for production auth)");
}

// Authenticated test endpoint
app.get("/test", shouldBeUser, (req: Request, res: Response) => {
  return res.status(200).json({
    message: "Unified API service is authenticated!",
    userId: req.userId,
  });
});

// Mount Routes
app.use("/products", productRouter);
app.use("/categories", categoryRouter);
app.use("/orders", orderRouter);
app.use("/user-orders", orderRouter);
app.use("/order-chart", orderRouter);
app.use("/sessions", sessionRouter);
app.use("/users", userRouter);

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("API Error:", err);
  return res
    .status(err.status || 500)
    .json({ message: err.message || "Internal Server Error!" });
});

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`🚀 Unified API Server is running on http://localhost:${PORT}`);
});

export default app;
