
import mongoose from "mongoose";
import ApiError from "./apiError.js";

export const parseLimit = (value, fallback = 25, max = 100) => {
  const parsed = Number(value || fallback);
  if (!Number.isInteger(parsed) || parsed < 1) {
    return fallback;
  }
  return Math.min(parsed, max);
};

export const buildCursorFilter = (cursor) => {
  if (!cursor) {
    return {};
  }

  if (!mongoose.Types.ObjectId.isValid(cursor)) {
    throw new ApiError(400, "Invalid cursor", "INVALID_CURSOR");
  }

  return { _id: { $lt: cursor } };
};

export const getNextCursor = (items, limit) => {
  if (items.length <= limit) {
    return null;
  }

  return items[limit - 1]._id.toString();
};

export const trimPage = (items, limit) => items.slice(0, limit);
