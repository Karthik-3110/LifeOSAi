import { Router } from "express";
import { body, param } from "express-validator";
import { addSemesterItem, addSubject, addTimetableLecture, deleteSemester, deleteSemesterItem, deleteSubject, deleteTimetableLecture, generateSemester, getSemester, getSemesters, updateSemester, updateSemesterItem, updateSubject, updateTimetableLecture } from "../controllers/semesterController.js";
import validate from "../middleware/validate.js";

const router = Router();
const types = ["exam", "assignment", "project"];
const subjectFields = [body("name").optional().isString().trim().isLength({ min: 1, max: 120 }), body("examDate").optional({ nullable: true, checkFalsy: true }).isISO8601(), body("internalExamDate").optional({ nullable: true, checkFalsy: true }).isISO8601(), body("assignmentDeadline").optional({ nullable: true, checkFalsy: true }).isISO8601(), body("projectDeadline").optional({ nullable: true, checkFalsy: true }).isISO8601(), body("difficulty").optional().isIn(["easy", "medium", "hard"]), body("credits").optional().isNumeric()];
const itemFields = [body("title").optional().isString().trim().isLength({ min: 1, max: 180 }), body("subject").optional().isString().trim().isLength({ max: 120 }), body("date").optional().isISO8601(), body("status").optional().isIn(["pending", "completed", "overdue"])];
const timetableDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const timetableTime = /^([01][0-9]|2[0-3]):[0-5][0-9]$/;
const timetableFieldNames = new Set(["day", "startTime", "endTime", "subject", "room", "faculty"]);
const requiredOrOptional = (field, required, message) => {
  const chain = body(field);
  return required ? chain.notEmpty().withMessage(message) : chain.optional();
};
const timetableFields = (required = false) => [
  requiredOrOptional("day", required, "Day is required.").bail().isIn(timetableDays).withMessage("Day must be a valid weekday."),
  requiredOrOptional("startTime", required, "Start time is required.").bail().matches(timetableTime).withMessage("Start time must use HH:MM (24-hour) format."),
  requiredOrOptional("endTime", required, "End time is required.").bail().matches(timetableTime).withMessage("End time must use HH:MM (24-hour) format."),
  requiredOrOptional("subject", required, "Subject is required.").bail().isString().trim().isLength({ min: 1, max: 120 }).withMessage("Subject must be between 1 and 120 characters."),
  body("room").optional({ nullable: true, checkFalsy: true }).isString().trim().isLength({ max: 120 }).withMessage("Room must be at most 120 characters."),
  body("faculty").optional({ nullable: true, checkFalsy: true }).isString().trim().isLength({ max: 120 }).withMessage("Faculty must be at most 120 characters."),
  body().custom((payload) => {
    const unexpected = Object.keys(payload || {}).filter((field) => !timetableFieldNames.has(field));
    if (unexpected.length) throw new Error(`Unsupported timetable fields: ${unexpected.join(", ")}.`);
    return true;
  }),
];

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
router.post("/:id/timetable", [param("id").isMongoId().withMessage("Invalid semester id."), ...timetableFields(true)], validate, addTimetableLecture);
router.patch("/:id/timetable/:lectureId", [param("id").isMongoId().withMessage("Invalid semester id."), param("lectureId").isString().trim().isLength({ min: 1, max: 120 }).withMessage("Invalid lecture id."), ...timetableFields()], validate, updateTimetableLecture);
router.delete("/:id/timetable/:lectureId", [param("id").isMongoId(), param("lectureId").isString().trim().isLength({ min: 1, max: 120 })], validate, deleteTimetableLecture);

export default router;
