import { Router } from "express";
import { body, param, query } from "express-validator";
import { createGoal, deleteGoal, listGoals, updateGoal } from "../controllers/goalController.js";
import validate from "../middleware/validate.js";

const router = Router();

const statusValidator = (field) => field.optional().isIn(["active", "done", "archived"]);

router.get(
  "/",
  [
    statusValidator(query("status")),
    query("limit").optional().isInt({ min: 1, max: 50 }),
    query("cursor").optional().isMongoId(),
  ],
  validate,
  listGoals
);

router.post(
  "/",
  [
    body("title").isString().trim().isLength({ min: 1, max: 180 }),
    body("description").optional().isString().trim().isLength({ max: 2000 }),
    body("priority").optional().isIn(["low", "medium", "high"]),
    body("category").optional().isString().trim().isLength({ max: 80 }),
    body("progress").optional().isInt({ min: 0, max: 100 }),
    body("dueDate").optional({ values: "null" }).isISO8601().toDate(),
    statusValidator(body("status")),
  ],
  validate,
  createGoal
);

router.patch(
  "/:id",
  [
    param("id").isMongoId(),
    body("title").optional().isString().trim().isLength({ min: 1, max: 180 }),
    body("description").optional().isString().trim().isLength({ max: 2000 }),
    body("priority").optional().isIn(["low", "medium", "high"]),
    body("category").optional().isString().trim().isLength({ max: 80 }),
    body("progress").optional().isInt({ min: 0, max: 100 }),
    body("dueDate").optional({ values: "null" }).isISO8601().toDate(),
    statusValidator(body("status")),
  ],
  validate,
  updateGoal
);

router.delete("/:id", [param("id").isMongoId()], validate, deleteGoal);

export default router;
