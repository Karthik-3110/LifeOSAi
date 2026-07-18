import OpenAI from "openai";
import ApiError from "../utils/apiError.js";

const DEFAULT_MODEL = "gpt-4o-mini";
const DEFAULT_TIMEOUT_MS = 30000;

let client;
let clientKey;
let verifiedModel;
let modelVerification;

const getModel = () => process.env.OPENAI_MODEL?.trim() || DEFAULT_MODEL;

export const getOpenAIModel = getModel;

const getTimeout = () => {
  const configured = Number(process.env.OPENAI_TIMEOUT_MS);
  return Number.isFinite(configured) && configured > 0 ? configured : DEFAULT_TIMEOUT_MS;
};

const getClient = () => {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new ApiError(
      503,
      "AI is not configured. Add OPENAI_API_KEY to the backend environment.",
      "OPENAI_NOT_CONFIGURED"
    );
  }

  if (!client || clientKey !== apiKey) {
    client = new OpenAI({
      apiKey,
      timeout: getTimeout(),
      maxRetries: 1,
    });
    clientKey = apiKey;
    verifiedModel = undefined;
    modelVerification = undefined;
  }

  return client;
};

const logOpenAIError = (operation, error) => {
  console.error(`[OpenAI] ${operation} failed`, {
    name: error?.name,
    message: error?.message,
    status: error?.status,
    code: error?.code,
    type: error?.type,
    requestId: error?.request_id || error?.requestID,
  });
};

const toProviderError = (error, operation) => {
  if (error instanceof ApiError) {
    logOpenAIError(operation, error);
    return error;
  }

  logOpenAIError(operation, error);

  if (error?.name === "APIConnectionTimeoutError" || error?.name === "AbortError") {
    return new ApiError(504, "AI generation timed out. Please try again.", "OPENAI_TIMEOUT");
  }

  if (error?.status === 429) {
    if (error?.code === "insufficient_quota") {
      return new ApiError(503, "AI provider quota is exhausted. Update the OpenAI billing configuration.", "OPENAI_QUOTA_EXHAUSTED");
    }
    return new ApiError(429, "AI is temporarily busy. Please try again shortly.", "OPENAI_RATE_LIMITED");
  }

  if (error?.status === 401 || error?.status === 403) {
    return new ApiError(503, "AI provider authentication failed. Check the backend OpenAI configuration.", "OPENAI_AUTH_FAILED");
  }

  if (error?.status === 404) {
    return new ApiError(503, `Configured OpenAI model \"${getModel()}\" is unavailable.`, "OPENAI_MODEL_UNAVAILABLE");
  }

  return new ApiError(503, "AI is temporarily unavailable. Please try again.", "OPENAI_UNAVAILABLE");
};

const verifyModel = async (openai, selectedModel) => {
  if (verifiedModel === selectedModel) return;

  if (!modelVerification) {
    modelVerification = openai.models.retrieve(selectedModel)
      .then(() => {
        verifiedModel = selectedModel;
      })
      .catch((error) => {
        throw toProviderError(error, "model verification");
      })
      .finally(() => {
        modelVerification = undefined;
      });
  }

  await modelVerification;
};

const parseJsonObject = (value) => {
  const text = String(value || "").trim();
  if (!text) {
    throw new ApiError(503, "AI returned an empty response.", "OPENAI_EMPTY_RESPONSE");
  }

  const withoutFence = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

  try {
    const parsed = JSON.parse(withoutFence);
    if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") {
      throw new Error("Expected a JSON object");
    }
    return parsed;
  } catch (error) {
    throw new ApiError(503, "AI returned an invalid structured response.", "OPENAI_INVALID_JSON", {
      reason: error.message,
    });
  }
};

const responseFormat = (name) => ({
  format: {
    type: "json_schema",
    name,
    strict: false,
    schema: {
      type: "object",
      additionalProperties: true,
    },
  },
});

export const generateStructuredResponse = async ({ system, prompt, schemaHint = "", responseName = "lifeos_response" }) => {
  const openai = getClient();
  const selectedModel = getModel();

  try {
    await verifyModel(openai, selectedModel);

    const response = await openai.responses.create({
      model: selectedModel,
      instructions: `${system}\nReturn JSON only.${schemaHint ? `\n${schemaHint}` : ""}`,
      input: prompt,
      text: responseFormat(responseName),
      store: false,
    });

    if (response.status !== "completed") {
      throw new ApiError(503, "AI did not complete the request.", "OPENAI_INCOMPLETE_RESPONSE", response.incomplete_details || response.error || undefined);
    }

    return parseJsonObject(response.output_text);
  } catch (error) {
    throw toProviderError(error, "response generation");
  }
};

export const generateSecondBrainPlan = ({ input, memory }) => generateStructuredResponse({
  responseName: "second_brain_plan",
  system: "You are LifeOS AI, an attentive student second brain. Use the supplied long-term memory to avoid duplicates, preserve active commitments, and turn a new Brain Dump into a practical, connected study plan.",
  schemaHint: "Include title, goals, tasks, notes, subjects, projects, habits, exams, events, people, dependencies, timeline, studyPlan, weeklyPlan, upcomingEvents, relationships, and categories. Goals need title, description, priority (low|medium|high), category, dueDate. Tasks need title, type (task|deadline|milestone), category, priority, dueDate, estimatedTime (minutes), recurring (none|daily|weekly|monthly), progress. Use ISO dates or null.",
  prompt: `Long-term memory:\n${JSON.stringify(memory)}\n\nNew Brain Dump:\n${input}`,
});

export const generateStudyCoachResponse = ({ prompt, memory }) => generateStructuredResponse({
  responseName: "study_coach_response",
  system: "You are LifeOS AI Study Coach. Give practical, encouraging guidance grounded in the learner's memory. Use active recall, spaced repetition, and short achievable study blocks. Do not invent deadlines or completed work.",
  schemaHint: "Include answer (string), nextSteps (array of up to 5 strings), and suggestedMinutes (number).",
  prompt: `Learner memory:\n${JSON.stringify(memory)}\n\nStudent request:\n${prompt}`,
});

export const generateDailyBrief = ({ memory, todaySummary }) => generateStructuredResponse({
  responseName: "daily_brief",
  system: "You are LifeOS AI's daily decision engine. Prioritize realistically, balance workload, and recommend what to do today. Never claim a task is complete unless it is marked complete.",
  schemaHint: "Include greeting (string), priorities (array of up to 4 task titles), studyRecommendation (string), suggestions (array of up to 3 strings), and productivityNote (string).",
  prompt: `Student memory:\n${JSON.stringify(memory)}\n\nToday's planner summary:\n${JSON.stringify(todaySummary)}`,
});
