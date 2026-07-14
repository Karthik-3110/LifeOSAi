import Goal from "../models/Goal.js";
import Task from "../models/Task.js";
import ApiError from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { buildCursorFilter, getNextCursor, parseLimit, trimPage } from "../utils/query.js";

const taskProjection = "goalId title type tag date time completed source createdAt";
const plannerTaskFilter = {
  $or: [
    { source: "planner" },
    { source: { $exists: false }, tag: { $in: ["", "Task"] } },
  ],
};

const assertGoalBelongsToUser = async (goalId, userId) => {
  if (!goalId) {
    return;
  }

  const exists = await Goal.exists({ _id: goalId, userId });

  if (!exists) {
    throw new ApiError(400, "Goal does not exist", "GOAL_NOT_FOUND");
  }
};

export const listTasks = asyncHandler(async (req, res) => {
  const limit = parseLimit(req.query.limit, 100, 200);
  const filter = {
    userId: req.user._id,
    ...plannerTaskFilter,
    ...buildCursorFilter(req.query.cursor),
  };

  if (req.query.from || req.query.to) {
    filter.date = {};
    if (req.query.from) {
      filter.date.$gte = new Date(req.query.from);
    }
    if (req.query.to) {
      filter.date.$lte = new Date(req.query.to);
    }
  }

  const tasks = await Task.find(filter)
    .select(taskProjection)
    .sort({ date: 1, _id: -1 })
    .limit(limit + 1)
    .lean();

  apiResponse(res, {
    items: trimPage(tasks, limit),
    nextCursor: getNextCursor(tasks, limit),
  });
});

export const createTask = asyncHandler(async (req, res) => {
  await assertGoalBelongsToUser(req.body.goalId, req.user._id);

  const task = await Task.create({
    userId: req.user._id,
    goalId: req.body.goalId || null,
    title: req.body.title,
    type: req.body.type,
    tag: req.body.tag,
    date: req.body.date,
    time: req.body.time,
    completed: req.body.completed,
    source: "planner",
  });

  apiResponse(res, {
    _id: task._id,
    goalId: task.goalId,
    title: task.title,
    type: task.type,
    tag: task.tag,
    date: task.date,
    time: task.time,
    completed: task.completed,
    source: task.source || "planner",
    createdAt: task.createdAt,
  }, 201);
});

export const updateTask = asyncHandler(async (req, res) => {
  if (req.body.goalId !== undefined && req.body.goalId !== null) {
    await assertGoalBelongsToUser(req.body.goalId, req.user._id);
  }

  const allowedFields = ["goalId", "title", "type", "tag", "date", "time", "completed"];
  const updates = {};

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      updates[field] = field === "goalId" && !req.body[field] ? null : req.body[field];
    }
  });

  const task = await Task.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    updates,
    {
      returnDocument: "after",
      runValidators: true,
      projection: taskProjection,
    }
  ).lean();

  if (!task) {
    throw new ApiError(404, "Task not found", "TASK_NOT_FOUND");
  }

  apiResponse(res, task);
});

export const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findOneAndDelete({
    _id: req.params.id,
    userId: req.user._id,
  }).select("_id").lean();

  if (!task) {
    throw new ApiError(404, "Task not found", "TASK_NOT_FOUND");
  }

  apiResponse(res, { deleted: true, id: req.params.id });
});
