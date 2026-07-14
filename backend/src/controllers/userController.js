import User from "../models/User.js";
import AIHistory from "../models/AIHistory.js";
import BrainDump from "../models/BrainDump.js";
import Canvas from "../models/Canvas.js";
import Goal from "../models/Goal.js";
import Note from "../models/Note.js";
import Task from "../models/Task.js";
import ApiError from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

export const updateCurrentUser = asyncHandler(async (req, res) => {
  const allowedFields = ["name", "email", "phoneNumber", "avatarUrl", "settings"];
  const updates = {};

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    returnDocument: "after",
    runValidators: true,
    projection: "firebaseUid name email phoneNumber avatarUrl brainDumpCredits unlimitedBrainDumpsUntil billingPlan workspace settings createdAt",
  }).lean();

  if (!user) {
    throw new ApiError(404, "User not found", "USER_NOT_FOUND");
  }

  apiResponse(res, user);
});

export const deleteCurrentUser = asyncHandler(async (req, res) => {
  await Promise.all([
    Goal.deleteMany({ userId: req.user._id }),
    Task.deleteMany({ userId: req.user._id }),
    Note.deleteMany({ userId: req.user._id }),
    BrainDump.deleteMany({ userId: req.user._id }),
    Canvas.deleteMany({ userId: req.user._id }),
    AIHistory.deleteMany({ userId: req.user._id }),
  ]);

  await User.findByIdAndDelete(req.user._id);

  apiResponse(res, { deleted: true });
});
