import { Router } from "express";
import { body, param } from "express-validator";
import { addSemesterItem, deleteSemesterItem, generateSemester, getSemester, getSemesters, updateSemesterItem } from "../controllers/semesterController.js";
import validate from "../middleware/validate.js";

const router = Router();
const itemValidation = [
  body("title").optional().isString().trim().isLength({ min: 1, max: 180 }),
  body("subject").optional().isString().trim().isLength({ max: 120 }),
  body("date").optional().isISO8601(),
  body("status").optional().isIn(["pending", "completed", "overdue"]),
];
router.get("/", getSemesters);
router.post("/generate", [body("manualEntry").isObject(), body("manualEntry.semester").isString().trim().isLength({ min: 1, max: 160 }), body("manualEntry.subjects").isArray({ min: 1, max: 16 })], validate, generateSemester);
router.post("/:id/items/:type", [param("id").isMongoId(), param("type").isIn(["exam", "assignment", "project"]), body("title").isString().trim().isLength({ min: 1, max: 180 }), body("date").isISO8601(), ...itemValidation], validate, addSemesterItem);
router.patch("/:id/items/:type/:itemId", [param("id").isMongoId(), param("type").isIn(["exam", "assignment", "project"]), param("itemId").isString().trim().isLength({ min: 1, max: 100 }), ...itemValidation], validate, updateSemesterItem);
router.delete("/:id/items/:type/:itemId", [param("id").isMongoId(), param("type").isIn(["exam", "assignment", "project"]), param("itemId").isString().trim().isLength({ min: 1, max: 100 })], validate, deleteSemesterItem);
router.get("/:id", [param("id").isMongoId()], validate, getSemester);
export default router;
