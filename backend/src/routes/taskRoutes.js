import { Router } from "express";
import { body, param, query } from "express-validator";
import { createTask, deleteTask, listTasks, updateTask } from "../controllers/taskController.js";
import validate from "../middleware/validate.js";

const router = Router();

const taskTypeValidator = (field) => field.optional().isIn(["task", "deadline", "milestone"]);

router.get(
  "/",
  [
    query("from").optional().isISO8601().toDate(),
    query("to").optional().isISO8601().toDate(),
    query("limit").optional().isInt({ min: 1, max: 200 }),
    query("cursor").optional().isMongoId(),
  ],
  validate,
  listTasks
);

router.post(
  "/",
  [
    body("goalId").optional({ values: "falsy" }).isMongoId(),
    body("title").isString().trim().isLength({ min: 1, max: 180 }),
    taskTypeValidator(body("type")),
    body("tag").optional().isString().trim().isLength({ max: 80 }),
    body("date").isISO8601().toDate(),
    body("time").optional().isString().trim().isLength({ max: 30 }),
    body("completed").optional().isBoolean().toBoolean(),
  ],
  validate,
  createTask
);

router.patch(
  "/:id",
  [
    param("id").isMongoId(),
    body("goalId").optional({ values: "falsy" }).isMongoId(),
    body("title").optional().isString().trim().isLength({ min: 1, max: 180 }),
    taskTypeValidator(body("type")),
    body("tag").optional().isString().trim().isLength({ max: 80 }),
    body("date").optional().isISO8601().toDate(),
    body("time").optional().isString().trim().isLength({ max: 30 }),
    body("completed").optional().isBoolean().toBoolean(),
  ],
  validate,
  updateTask
);

router.delete("/:id", [param("id").isMongoId()], validate, deleteTask);

export default router;
