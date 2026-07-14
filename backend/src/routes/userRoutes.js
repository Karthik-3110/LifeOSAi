import { Router } from "express";
import { body } from "express-validator";
import { deleteCurrentUser, updateCurrentUser } from "../controllers/userController.js";
import validate from "../middleware/validate.js";

const router = Router();

router.patch(
  "/me",
  [
    body("name").optional().isString().trim().isLength({ max: 120 }),
    body("email").optional().isEmail().normalizeEmail(),
    body("phoneNumber").optional().isString().trim().isLength({ max: 40 }),
    body("avatarUrl").optional().isString().trim().isLength({ max: 2500000 }),
    body("settings").optional().isObject(),
    body("settings.defaultCanvasView").optional().isString().trim().isLength({ max: 40 }),
  ],
  validate,
  updateCurrentUser
);

router.delete("/me", deleteCurrentUser);

export default router;
