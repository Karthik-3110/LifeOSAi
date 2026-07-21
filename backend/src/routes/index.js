import { Router } from "express";
import authRoutes from "./authRoutes.js";
import canvasRoutes from "./canvasRoutes.js";
import dashboardRoutes from "./dashboardRoutes.js";
import analyticsRoutes from "./analyticsRoutes.js";
import billingRoutes from "./billingRoutes.js";
import goalRoutes from "./goalRoutes.js";
import taskRoutes from "./taskRoutes.js";
import userRoutes from "./userRoutes.js";
import aiRoutes from "./aiRoutes.js";
import semesterRoutes from "./semesterRoutes.js";
import notificationRoutes from "./notificationRoutes.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/health", (req, res) => {
  res.json({
    success: true,
    data: {
      status: "ok",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    },
  });
});

router.use("/auth", requireAuth, authRoutes);

router.use(requireAuth);
router.use("/users", userRoutes);
router.use("/goals", goalRoutes);
router.use("/tasks", taskRoutes);
router.use("/canvas", canvasRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/billing", billingRoutes);
router.use("/ai", aiRoutes);
router.use("/semesters", semesterRoutes);
router.use("/notifications", notificationRoutes);

export default router;
