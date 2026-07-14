import { apiResponse } from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

export const getMe = asyncHandler(async (req, res) => {
  apiResponse(res, req.user);
});
