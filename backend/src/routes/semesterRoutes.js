import { Router } from "express";
import { body, param } from "express-validator";
import { addSemesterItem, addSubject, addTimetableLecture, deleteSemester, deleteSemesterItem, deleteSubject, deleteTimetableLecture, generateSemester, getSemester, getSemesters, updateSemester, updateSemesterItem, updateSubject, updateTimetableLecture } from "../controllers/semesterController.js";
import validate from "../middleware/validate.js";

const router = Router();
const types = ["exam", "assignment", "project"];
const subjectFields = [body("name").optional().isString().trim().isLength({ min: 1, max: 120 }), body("examDate").optional({ nullable: true, checkFalsy: true }).isISO8601(), body("internalExamDate").optional({ nullable: true, checkFalsy: true }).isISO8601(), body("assignmentDeadline").optional({ nullable: true, checkFalsy: true }).isISO8601(), body("projectDeadline").optional({ nullable: true, checkFalsy: true }).isISO8601(), body("difficulty").optional().isIn(["easy", "medium", "hard"]), body("credits").optional().isNumeric()];
const itemFields = [body("title").optional().isString().trim().isLength({ min: 1, max: 180 }), body("subject").optional().isString().trim().isLength({ max: 120 }), body("date").optional().isISO8601(), body("status").optional().isIn(["pending", "completed", "overdue"])];
const lectureFields = [body("day").optional().isIn(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]), body("startTime").optional().matches(/^([01]\\d|2[0-3]):[0-5]\\d$/), body("endTime").optional().matches(/^([01]\\d|2[0-3]):[0-5]\\d$/), body("subject").optional().isString().trim().isLength({ max: 120 }), body("room").optional().isString().trim().isLength({ max: 120 }), body("faculty").optional().isString().trim().isLength({ max: 120 })];

router.get("/", getSemesters);
router.post("/generate", [body("manualEntry").isObject(), body("manualEntry.semester").isString().trim().isLength({ min: 1, max: 160 }), body("manualEntry.subjects").isArray({ min: 1, max: 16 })], validate, generateSemester);
router.get("/:id", [param("id").isMongoId()], validate, getSemester);
router.patch("/:id", [param("id").isMongoId(), body("name").isString().trim().isLength({ min: 1, max: 160 })], validate, updateSemester);
router.delete("/:id", [param("id").isMongoId()], validate, deleteSemester);
router.post("/:id/subjects", [param("id").isMongoId(), body("name").isString().trim().isLength({ min: 1, max: 120 }), ...subjectFields], validate, addSubject);
router.patch("/:id/subjects/:subjectId", [param("id").isMongoId(), param("subjectId").isString().trim().isLength({ min: 1, max: 120 }), ...subjectFields], validate, updateSubject);
router.delete("/:id/subjects/:subjectId", [param("id").isMongoId(), param("subjectId").isString().trim().isLength({ min: 1, max: 120 })], validate, deleteSubject);
router.post("/:id/items/:type", [param("id").isMongoId(), param("type").isIn(types), body("title").isString().trim().isLength({ min: 1, max: 180 }), body("date").isISO8601(), ...itemFields], validate, addSemesterItem);
router.patch("/:id/items/:type/:itemId", [param("id").isMongoId(), param("type").isIn(types), param("itemId").isString().trim().isLength({ min: 1, max: 100 }), ...itemFields], validate, updateSemesterItem);
router.delete("/:id/items/:type/:itemId", [param("id").isMongoId(), param("type").isIn(types), param("itemId").isString().trim().isLength({ min: 1, max: 100 })], validate, deleteSemesterItem);
router.post("/:id/timetable", [param("id").isMongoId(), body("day").isIn(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]), body("startTime").matches(/^([01]\\d|2[0-3]):[0-5]\\d$/), body("endTime").matches(/^([01]\\d|2[0-3]):[0-5]\\d$/), body("subject").isString().trim().isLength({ min: 1, max: 120 }), ...lectureFields], validate, addTimetableLecture);
router.patch("/:id/timetable/:lectureId", [param("id").isMongoId(), param("lectureId").isString().trim().isLength({ min: 1, max: 120 }), ...lectureFields], validate, updateTimetableLecture);
router.delete("/:id/timetable/:lectureId", [param("id").isMongoId(), param("lectureId").isString().trim().isLength({ min: 1, max: 120 })], validate, deleteTimetableLecture);

export default router;
