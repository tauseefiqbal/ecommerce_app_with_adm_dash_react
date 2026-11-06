import { Router } from "express";
import {
  createUser,
  deleteUser,
  getUser,
  getUsers,
} from "../controllers/user.controller.js";
import { shouldBeAdmin } from "../middleware/authMiddleware.js";

const router: Router = Router();

router.get("/", shouldBeAdmin, getUsers);
router.get("/:id", shouldBeAdmin, getUser);
router.post("/", shouldBeAdmin, createUser);
router.delete("/:id", shouldBeAdmin, deleteUser);

export default router;
