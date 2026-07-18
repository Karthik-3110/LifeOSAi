import ApiError from "../utils/apiError.js";

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const model = () => process.env.OPENAI_MODEL || "gpt-4o-mini";

const getContent = (content) => {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content.map((part) => part?.text || part?.content || "").join("");
  }
  return "";
};

export const generateStructuredResponse = async ({ system, prompt, schemaHint = "" }) => {
  if (!process.env.OPENAI_API_KEY) {
    throw new ApiError(503, "AI is not configured. Add OPENAI_API_KEY to the backend environment.", "OPENAI_NOT_CONFIGURED");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(OPENAI_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model(),
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: `${system}\nReturn valid JSON only.${schemaHint ? `\n${schemaHint}` : ""}` },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      const details = (await response.text()).slice(0, 500);
      throw new ApiError(502, "OpenAI request failed", "OPENAI_REQUEST_FAILED", details);
    }

    const payload = await response.json();
    const content = getContent(payload?.choices?.[0]?.message?.content);
    if (!content) {
      throw new ApiError(502, "OpenAI returned an empty response", "OPENAI_EMPTY_RESPONSE");
    }

    try {
      return JSON.parse(content);
    } catch {
      throw new ApiError(502, "OpenAI returned invalid JSON", "OPENAI_INVALID_JSON");
    }
  } catch (error) {
    if (error.name === "AbortError") {
      throw new ApiError(504, "OpenAI request timed out", "OPENAI_TIMEOUT");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
};

export const generateSecondBrainPlan = ({ input, memory }) => generateStructuredResponse({
  system: "You are LifeOS AI, an attentive student second brain. Use the supplied long-term memory to avoid duplicates, preserve active commitments, and turn a new Brain Dump into a practical, connected study plan.",
  schemaHint: "Include title, goals, tasks, notes, subjects, projects, habits, exams, events, people, dependencies, timeline, studyPlan, weeklyPlan, upcomingEvents, relationships, and categories. Goals need title, description, priority (low|medium|high), category, dueDate. Tasks need title, type (task|deadline|milestone), category, priority, dueDate, estimatedTime (minutes), recurring (none|daily|weekly|monthly), progress. Use ISO dates or null.",
  prompt: `Long-term memory:\n${JSON.stringify(memory)}\n\nNew Brain Dump:\n${input}`,
});

export const generateStudyCoachResponse = ({ prompt, memory }) => generateStructuredResponse({
  system: "You are LifeOS AI Study Coach. Give practical, encouraging guidance grounded in the learner's memory. Use active recall, spaced repetition, and short achievable study blocks. Do not invent deadlines or completed work.",
  schemaHint: "Include answer (string), nextSteps (array of up to 5 strings), and suggestedMinutes (number).",
  prompt: `Learner memory:\n${JSON.stringify(memory)}\n\nStudent request:\n${prompt}`,
});

export const generateDailyBrief = ({ memory, todaySummary }) => generateStructuredResponse({
  system: "You are LifeOS AI's daily decision engine. Prioritize realistically, balance workload, and recommend what to do today. Never claim a task is complete unless it is marked complete.",
  schemaHint: "Include greeting (string), priorities (array of up to 4 task titles), studyRecommendation (string), suggestions (array of up to 3 strings), and productivityNote (string).",
  prompt: `Student memory:\n${JSON.stringify(memory)}\n\nToday's planner summary:\n${JSON.stringify(todaySummary)}`,
});
