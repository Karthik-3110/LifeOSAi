import Goal from "../models/Goal.js";
import ApiError from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { buildCursorFilter, getNextCursor, parseLimit, trimPage } from "../utils/query.js";

const goalProjection = "title description priority category progress dueDate status createdAt";

export const listGoals = asyncHandler(async (req, res) => {
  const limit = parseLimit(req.query.limit, 25, 50);
  const filter = {
    userId: req.user._id,
    ...buildCursorFilter(req.query.cursor),
  };

  if (req.query.status) {
    filter.status = req.query.status;
  }

  const goals = await Goal.find(filter)
    .select(goalProjection)
    .sort({ _id: -1 })
    .limit(limit + 1)
    .lean();

  apiResponse(res, {
    items: trimPage(goals, limit),
    nextCursor: getNextCursor(goals, limit),
  });
});

export const createGoal = asyncHandler(async (req, res) => {
  const goal = await Goal.create({
    userId: req.user._id,
    title: req.body.title,
    description: req.body.description,
    priority: req.body.priority,
    category: req.body.category,
    progress: req.body.progress,
    dueDate: req.body.dueDate,
    status: req.body.status,
  });

  apiResponse(res, {
    _id: goal._id,
    title: goal.title,
    description: goal.description,
    priority: goal.priority,
    category: goal.category,
    progress: goal.progress,
    dueDate: goal.dueDate,
    status: goal.status,
    createdAt: goal.createdAt,
  }, 201);
});

export const updateGoal = asyncHandler(async (req, res) => {
  const allowedFields = ["title", "description", "priority", "category", "progress", "dueDate", "status"];
  const updates = {};

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });

  const goal = await Goal.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    updates,
    {
      returnDocument: "after",
      runValidators: true,
      projection: goalProjection,
    }
  ).lean();

  if (!goal) {
    throw new ApiError(404, "Goal not found", "GOAL_NOT_FOUND");
  }

  apiResponse(res, goal);
});

export const deleteGoal = asyncHandler(async (req, res) => {
  const goal = await Goal.findOneAndDelete({
    _id: req.params.id,
    userId: req.user._id,
  }).select("_id").lean();

  if (!goal) {
    throw new ApiError(404, "Goal not found", "GOAL_NOT_FOUND");
  }

  apiResponse(res, { deleted: true, id: req.params.id });
});
