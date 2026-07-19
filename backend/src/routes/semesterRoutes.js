import { Router } from "express";
import { body, param } from "express-validator";
import { generateSemester, getSemester, getSemesters, updateAssignment } from "../controllers/semesterController.js";
import validate from "../middleware/validate.js";

const router = Router();

router.get("/", getSemesters);
router.get("/:id", [param("id").isMongoId()], validate, getSemester);
router.post("/generate", [
  body("manualEntry").optional().isObject(),
  body("documents").optional().isArray({ max: 6 }),
  body("documents.*.name").optional().isString().isLength({ min: 1, max: 180 }),
  body("documents.*.type").optional().isString().isLength({ min: 1, max: 120 }),
  body("documents.*.base64").optional().isString().isLength({ min: 1 }),
], validate, generateSemester);
router.patch("/:id/assignments/:assignmentId", [
  param("id").isMongoId(),
  param("assignmentId").isString().trim().isLength({ min: 1, max: 80 }),
  body("status").optional().isIn(["pending", "completed", "overdue"]),
  body("progress").optional().isInt({ min: 0, max: 100 }),
  body("title").optional().isString().trim().isLength({ min: 1, max: 180 }),
  body("date").optional().isISO8601().toDate(),
], validate, updateAssignment);

export default router;
