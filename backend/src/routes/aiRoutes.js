import { Router } from "express";
import { body } from "express-validator";
import { askStudyCoach } from "../controllers/aiController.js";
import validate from "../middleware/validate.js";

const router = Router();

router.post(
  "/study-coach",
  [body("prompt").isString().trim().isLength({ min: 3, max: 4000 })],
  validate,
  askStudyCoach
);

export default router;
