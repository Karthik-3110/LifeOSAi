import { Router } from "express";
import { param } from "express-validator";
import { clearNotifications, listNotifications, markAllNotificationsRead, markNotificationRead } from "../controllers/notificationController.js";
import validate from "../middleware/validate.js";

const router = Router();
router.get("/", listNotifications);
router.patch("/read-all", markAllNotificationsRead);
router.delete("/", clearNotifications);
router.patch("/:id/read", [param("id").isMongoId()], validate, markNotificationRead);
export default router;
