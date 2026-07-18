import AIHistory from "../models/AIHistory.js";
import { getSecondBrainMemory } from "../services/memoryService.js";
import { generateStudyCoachResponse } from "../services/openaiService.js";
import { apiResponse } from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

export const askStudyCoach = asyncHandler(async (req, res) => {
  const prompt = String(req.body.prompt || "").trim();
  const memory = await getSecondBrainMemory(req.user._id);
  const response = await generateStudyCoachResponse({ prompt, memory });

  await AIHistory.create({
    userId: req.user._id,
    action: "study-coach",
    input: prompt,
    output: response,
  });

  apiResponse(res, response);
});
