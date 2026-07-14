import { Router } from "express";
import { getMe } from "../controllers/authController.js";

const router = Router();

router.get("/me", getMe);

export default router;
