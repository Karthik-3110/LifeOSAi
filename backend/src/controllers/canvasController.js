import Canvas, { ensureCanvasIndexes } from "../models/Canvas.js";
import AIHistory from "../models/AIHistory.js";
import BrainDump from "../models/BrainDump.js";
import Goal from "../models/Goal.js";
import Note from "../models/Note.js";
import User from "../models/User.js";
import ApiError from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const taskKeywords = /\b(todo|task|need to|must|should|call|email|write|ship|finish|fix|create|build|send|review|schedule)\b/i;
const goalKeywords = /\b(goal|want to|aim|objective|launch|become|learn|grow|improve|complete)\b/i;
const deadlineKeywords = /\b(deadline|due|by|before|tomorrow|today|next week|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i;

const startOfToday = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};

const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const parseDueDate = (text) => {
  const lower = text.toLowerCase();
  const today = startOfToday();

  if (lower.includes("today")) return today;
  if (lower.includes("tomorrow")) return addDays(today, 1);
  if (lower.includes("next week")) return addDays(today, 7);

  const isoDate = text.match(/\b(20\d{2}-\d{2}-\d{2})\b/);
  if (isoDate) return new Date(isoDate[1]);

  const shortDate = text.match(/\b(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?\b/);
  if (shortDate) {
    const year = shortDate[3] ? Number(shortDate[3].padStart(4, "20")) : today.getFullYear();
    return new Date(year, Number(shortDate[2]) - 1, Number(shortDate[1]));
  }

  return null;
};

const cleanSentence = (sentence) => sentence.replace(/^[-*\d.)\s]+/, "").trim();

const splitThoughts = (input) => input
  .split(/\n|[.!?;]+/)
  .map(cleanSentence)
  .filter(Boolean)
  .slice(0, 24);

const inferDurationDays = (input) => {
  const lower = input.toLowerCase();
  const explicit = lower.match(/\b(?:in|within)\s+(\d{1,2})\s+(day|days|week|weeks|month|months)\b/);
  if (explicit) {
    const amount = Number(explicit[1]);
    const unit = explicit[2];
    if (unit.startsWith("day")) return amount;
    if (unit.startsWith("week")) return amount * 7;
    if (unit.startsWith("month")) return amount * 30;
  }

  if (/\b(month|30 days)\b/.test(lower)) return 30;
  if (/\b(week|7 days)\b/.test(lower)) return 7;
  return 21;
};

const buildRoadmapFallbackTasks = (goalTitle, input, category = "general") => {
  const lower = `${goalTitle} ${input}`.toLowerCase();
  const durationDays = inferDurationDays(input);
  const today = startOfToday();
  const dueAt = (ratio) => addDays(today, Math.max(1, Math.round(durationDays * ratio)));

  if (/\b(learn|study|course|dsa|data structure|algorithm|programming|coding)\b/.test(lower)) {
    const topic = goalTitle.replace(/^i\s+want\s+to\s+/i, "").replace(/^learn\s+/i, "").trim() || "the topic";
    return [
      { title: `Define the ${topic} syllabus and daily practice slots`, type: "task", category, dueDate: dueAt(0.1) },
      { title: `Build fundamentals for ${topic}`, type: "task", category, dueDate: dueAt(0.25) },
      { title: `Practice core problems and patterns`, type: "task", category, dueDate: dueAt(0.45) },
      { title: `Take timed practice sessions and review mistakes`, type: "task", category, dueDate: dueAt(0.7) },
      { title: `Complete the final revision and readiness check`, type: "deadline", category, dueDate: dueAt(1) },
    ];
  }

  return [
    { title: "Clarify the outcome and success criteria", type: "task", category, dueDate: dueAt(0.15) },
    { title: "Break the work into weekly milestones", type: "task", category, dueDate: dueAt(0.3) },
    { title: "Finish the first working version", type: "task", category, dueDate: dueAt(0.55) },
    { title: "Review gaps and remove blockers", type: "task", category, dueDate: dueAt(0.78) },
    { title: "Complete the roadmap", type: "deadline", category, dueDate: dueAt(1) },
  ];
};

const categorize = (text) => {
  const lower = text.toLowerCase();
  const categories = [];

  if (/\b(work|project|launch|ship|client|meeting|product)\b/.test(lower)) categories.push("work");
  if (/\b(health|sleep|run|gym|doctor|meal)\b/.test(lower)) categories.push("health");
  if (/\b(money|budget|invoice|pay|revenue|sales)\b/.test(lower)) categories.push("finance");
  if (/\b(learn|study|course|read|practice)\b/.test(lower)) categories.push("learning");
  if (/\b(family|friend|call|message|relationship)\b/.test(lower)) categories.push("relationships");

  return categories.length ? categories : ["general"];
};

const normalizePriority = (value) => (["low", "medium", "high"].includes(value) ? value : "medium");

const toValidDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? null : date;
};

const normalizeRoadmap = (roadmap, input) => {
  const fallback = analyzeThoughts(input);
  const tasks = Array.isArray(roadmap?.tasks) && roadmap.tasks.length ? roadmap.tasks : fallback.tasks;
  const goals = Array.isArray(roadmap?.goals) && roadmap.goals.length ? roadmap.goals : fallback.goals;
  const notes = Array.isArray(roadmap?.notes) && roadmap.notes.length ? roadmap.notes : fallback.notes;

  return {
    title: String(roadmap?.title || goals[0]?.title || input.slice(0, 60) || "Brain Dump").slice(0, 120),
    tasks: tasks.slice(0, 24).map((task, index) => ({
      title: String(task.title || task.name || `Task ${index + 1}`).slice(0, 180),
      type: task.type === "deadline" ? "deadline" : "task",
      category: String(task.category || task.tag || "general").slice(0, 80),
      dueDate: toValidDate(task.dueDate) || parseDueDate(String(task.title || "")),
      sourceIndex: index,
    })),
    goals: goals.slice(0, 12).map((goal, index) => ({
      title: String(goal.title || goal.name || `Goal ${index + 1}`).slice(0, 180),
      description: String(goal.description || "").slice(0, 2000),
      category: String(goal.category || "Personal").slice(0, 80),
      priority: normalizePriority(goal.priority),
      dueDate: toValidDate(goal.dueDate) || parseDueDate(String(goal.title || "")),
      sourceIndex: index,
    })),
    notes: notes.slice(0, 24).map((note, index) => ({
      title: String(note.title || note.body || note.text || `Note ${index + 1}`).slice(0, 180),
      category: String(note.category || "general").slice(0, 80),
      sourceIndex: index,
    })),
    relationships: Array.isArray(roadmap?.relationships) ? roadmap.relationships : fallback.relationships,
    categories: Array.isArray(roadmap?.categories) ? roadmap.categories.slice(0, 12).map(String) : fallback.categories,
  };
};

const analyzeThoughts = (input) => {
  const sentences = splitThoughts(input);
  const tasks = [];
  const goals = [];
  const notes = [];
  const relationships = [];
  const categories = new Set();

  sentences.forEach((sentence, index) => {
    const [category] = categorize(sentence);
    categories.add(category);
    const dueDate = parseDueDate(sentence);
    const item = {
      title: sentence.slice(0, 180),
      sourceIndex: index,
      category,
      dueDate,
    };

    if (goalKeywords.test(sentence) && !taskKeywords.test(sentence)) {
      goals.push({ ...item, priority: "medium", description: "" });
      return;
    }

    if (taskKeywords.test(sentence) || deadlineKeywords.test(sentence)) {
      tasks.push({
        ...item,
        type: deadlineKeywords.test(sentence) || dueDate ? "deadline" : "task",
      });
      return;
    }

    notes.push(item);
  });

  if (!goals.length && sentences.length) {
    const [category] = categorize(sentences[0]);
    goals.push({
      title: sentences[0].slice(0, 180),
      description: "",
      priority: "medium",
      sourceIndex: 0,
      category,
      dueDate: null,
    });
  }

  if (!tasks.length && goals.length) {
    tasks.push(...buildRoadmapFallbackTasks(goals[0].title, input, goals[0].category));
  }

  tasks.forEach((task, index) => {
    if (goals.length) {
      relationships.push({
        sourceType: "goal",
        sourceIndex: index % goals.length,
        targetType: "task",
        targetIndex: index,
        label: "supports",
      });
    }
  });

  notes.forEach((note, index) => {
    if (goals.length) {
      relationships.push({
        sourceType: "goal",
        sourceIndex: index % goals.length,
        targetType: "note",
        targetIndex: index,
        label: "context",
      });
    }
  });

  return {
    title: goals[0]?.title || sentences[0] || "Brain Dump",
    tasks,
    goals,
    notes,
    relationships,
    categories: [...categories],
  };
};

const analyzeWithGroq = async (input) => {
  if (!process.env.GROQ_API_KEY) {
    return normalizeRoadmap(analyzeThoughts(input), input);
  }

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL || "llama-3.1-8b-instant",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "Turn messy thoughts into JSON with keys title, goals, tasks, notes, relationships, categories. Goals need title, description, priority low|medium|high, category, dueDate. Tasks need title, type task|deadline, category, dueDate. Use ISO dates or null.",
        },
        { role: "user", content: input },
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new ApiError(502, "Groq roadmap generation failed", "GROQ_REQUEST_FAILED", text.slice(0, 500));
  }

  const payload = await response.json();
  const content = payload?.choices?.[0]?.message?.content;

  try {
    return normalizeRoadmap(JSON.parse(content), input);
  } catch {
    throw new ApiError(502, "Groq returned invalid roadmap JSON", "GROQ_INVALID_JSON");
  }
};

const createCanvasArtifacts = ({ goals, tasks, notes }, existingCount = 0) => {
  const timestamp = Date.now();
  const nodes = [];
  const edges = [];

  goals.forEach((goal, index) => {
    nodes.push({
      id: `goal-${timestamp}-${index}`,
      type: "goal",
      position: { x: 80 + index * 280, y: 170 },
      data: {
        label: goal.title,
        meta: `${goal.category || "Personal"} - ${goal.priority || "medium"}`,
        completed: false,
      },
    });
  });

  tasks.forEach((task, index) => {
    const id = `${task.type === "deadline" ? "deadline" : "task"}-${timestamp}-${index}`;
    const row = Math.floor(index / 4);
    const column = index % 4;
    nodes.push({
      id,
      type: task.type === "deadline" ? "deadline" : "task",
      position: { x: 380 + column * 300, y: 90 + row * 190 },
      data: {
        label: task.title,
        meta: task.dueDate instanceof Date && !Number.isNaN(task.dueDate.valueOf())
          ? `Due ${task.dueDate.toISOString().slice(0, 10)}`
          : task.category,
        completed: false,
        sequence: index + 1,
      },
    });

    if (goals.length) {
      const previousTask = index > 0
        ? nodes.find((node) => node.id === `${tasks[index - 1].type === "deadline" ? "deadline" : "task"}-${timestamp}-${index - 1}`)
        : null;
      edges.push({
        id: `edge-${timestamp}-task-${index}`,
        source: previousTask?.id || nodes[index % goals.length].id,
        target: id,
        animated: true,
        style: { stroke: "var(--node-task)" },
      });
    }
  });

  notes.forEach((note, index) => {
    const id = `resource-${timestamp}-${index}`;
    nodes.push({
      id,
      type: "resource",
      position: { x: 380 + (index % 3) * 300, y: 320 + Math.floor(tasks.length / 4) * 190 + Math.floor(index / 3) * 150 },
      data: {
        label: note.title,
        meta: note.category,
        completed: false,
      },
    });

    if (goals.length) {
      edges.push({
        id: `edge-${timestamp}-note-${index}`,
        source: nodes[index % goals.length].id,
        target: id,
        animated: true,
        style: { stroke: "var(--node-resource)" },
      });
    }
  });

  return {
    nodes: nodes.map((node, index) => ({
      ...node,
      position: {
        x: node.position.x + (existingCount % 6) * 24,
        y: node.position.y + Math.floor(existingCount / 6) * 24 + index * 4,
      },
    })),
    edges,
  };
};

const hasUnlimitedBrainDumps = (user) => user.unlimitedBrainDumpsUntil && new Date(user.unlimitedBrainDumpsUntil) > new Date();

const assertBrainDumpCreditAvailable = (user) => {
  if (!hasUnlimitedBrainDumps(user) && (user.brainDumpCredits || 0) <= 0) {
    throw new ApiError(402, "You are out of Brain Dump credits.", "CREDITS_EXHAUSTED");
  }
};

const consumeBrainDumpCredit = async (user) => {
  if (hasUnlimitedBrainDumps(user)) {
    return user;
  }

  const updated = await User.findOneAndUpdate(
    { _id: user._id, brainDumpCredits: { $gt: 0 } },
    { $inc: { brainDumpCredits: -1 } },
    {
      returnDocument: "after",
      projection: "brainDumpCredits unlimitedBrainDumpsUntil billingPlan",
    }
  ).lean();

  if (!updated) {
    throw new ApiError(402, "You are out of Brain Dump credits.", "CREDITS_EXHAUSTED");
  }

  return updated;
};

const getOwnedBrainDump = async (brainDumpId, userId) => {
  const brainDump = await BrainDump.findOne({ _id: brainDumpId, userId }).lean();
  if (!brainDump) {
    throw new ApiError(404, "Brain Dump not found", "BRAIN_DUMP_NOT_FOUND");
  }
  return brainDump;
};

export const listBrainDumps = asyncHandler(async (req, res) => {
  const items = await BrainDump.find({ userId: req.user._id })
    .select("title createdAt")
    .sort({ createdAt: -1, _id: -1 })
    .limit(100)
    .lean();

  apiResponse(res, { items });
});

export const getCanvas = asyncHandler(async (req, res) => {
  const brainDumpId = req.params.brainDumpId
    || (await BrainDump.findOne({ userId: req.user._id }).sort({ createdAt: -1 }).select("_id").lean())?._id;

  if (!brainDumpId) {
    apiResponse(res, { brainDump: null, nodes: [], edges: [], updatedAt: null });
    return;
  }

  const brainDump = await getOwnedBrainDump(brainDumpId, req.user._id);
  const canvas = await Canvas.findOne({ userId: req.user._id, brainDumpId })
    .select("brainDumpId nodes edges updatedAt")
    .lean();

  apiResponse(res, {
    brainDump: {
      _id: brainDump._id,
      title: brainDump.title,
      input: brainDump.input,
      createdAt: brainDump.createdAt,
    },
    ...(canvas || { brainDumpId, nodes: [], edges: [], updatedAt: null }),
  });
});

export const saveCanvas = asyncHandler(async (req, res) => {
  const brainDumpId = req.params.brainDumpId || req.body.brainDumpId;
  if (!brainDumpId) {
    throw new ApiError(400, "brainDumpId is required to save a canvas", "BRAIN_DUMP_REQUIRED");
  }

  await getOwnedBrainDump(brainDumpId, req.user._id);
  await ensureCanvasIndexes();

  const canvas = await Canvas.findOneAndUpdate(
    { userId: req.user._id, brainDumpId },
    {
      brainDumpId,
      nodes: req.body.nodes || [],
      edges: req.body.edges || [],
      updatedAt: new Date(),
    },
    {
      returnDocument: "after",
      upsert: true,
      setDefaultsOnInsert: true,
      runValidators: true,
      projection: "brainDumpId nodes edges updatedAt",
    }
  ).lean();

  apiResponse(res, canvas);
});

export const analyzeBrainDump = asyncHandler(async (req, res) => {
  const input = String(req.body.input || "").trim();
  assertBrainDumpCreditAvailable(req.user);
  const extracted = await analyzeWithGroq(input);
  const creditState = await consumeBrainDumpCredit(req.user);

  const createdGoals = await Goal.insertMany(
    extracted.goals.map((goal) => ({
      userId: req.user._id,
      title: goal.title,
      description: goal.description,
      priority: goal.priority,
      category: goal.category,
      dueDate: goal.dueDate,
      progress: 0,
      status: "active",
    })),
    { ordered: false }
  );

  const createdNotes = await Note.insertMany(
    extracted.notes.map((note) => ({
      userId: req.user._id,
      title: note.title,
      body: note.title,
      category: note.category,
      source: "brain-dump",
    })),
    { ordered: false }
  );

  const brainDump = await BrainDump.create({
    userId: req.user._id,
    title: extracted.title,
    input,
    extracted,
  });

  const generatedCanvas = createCanvasArtifacts(extracted, 0);
  await ensureCanvasIndexes();

  const canvas = await Canvas.create({
    userId: req.user._id,
    brainDumpId: brainDump._id,
    nodes: generatedCanvas.nodes,
    edges: generatedCanvas.edges,
  });

  await AIHistory.create({
    userId: req.user._id,
    action: "brain-dump",
    input,
    output: {
      extracted,
      nodeCount: generatedCanvas.nodes.length,
      edgeCount: generatedCanvas.edges.length,
    },
  });

  apiResponse(res, {
    brainDump: {
      _id: brainDump._id,
      title: brainDump.title,
      input: brainDump.input,
      createdAt: brainDump.createdAt,
    },
    extracted,
    created: {
      goals: createdGoals,
      tasks: [],
      notes: createdNotes,
    },
    canvas,
    credits: creditState,
  }, 201);
});

export const renameBrainDump = asyncHandler(async (req, res) => {
  const brainDump = await BrainDump.findOneAndUpdate(
    { _id: req.params.brainDumpId, userId: req.user._id },
    { title: req.body.title },
    {
      returnDocument: "after",
      runValidators: true,
      projection: "title input createdAt",
    }
  ).lean();

  if (!brainDump) {
    throw new ApiError(404, "Brain Dump not found", "BRAIN_DUMP_NOT_FOUND");
  }

  apiResponse(res, brainDump);
});

export const deleteBrainDump = asyncHandler(async (req, res) => {
  const brainDump = await BrainDump.findOneAndDelete({ _id: req.params.brainDumpId, userId: req.user._id })
    .select("_id")
    .lean();

  if (!brainDump) {
    throw new ApiError(404, "Brain Dump not found", "BRAIN_DUMP_NOT_FOUND");
  }

  await Canvas.deleteMany({ userId: req.user._id, brainDumpId: req.params.brainDumpId });
  apiResponse(res, { deleted: true, id: req.params.brainDumpId });
});

export const duplicateBrainDump = asyncHandler(async (req, res) => {
  const source = await getOwnedBrainDump(req.params.brainDumpId, req.user._id);
  const sourceCanvas = await Canvas.findOne({ userId: req.user._id, brainDumpId: source._id }).lean();

  const copy = await BrainDump.create({
    userId: req.user._id,
    title: `${source.title} copy`.slice(0, 120),
    input: source.input,
    extracted: source.extracted,
  });

  await ensureCanvasIndexes();
  const canvas = await Canvas.create({
    userId: req.user._id,
    brainDumpId: copy._id,
    nodes: sourceCanvas?.nodes || [],
    edges: sourceCanvas?.edges || [],
  });

  apiResponse(res, {
    brainDump: {
      _id: copy._id,
      title: copy.title,
      input: copy.input,
      createdAt: copy.createdAt,
    },
    canvas,
  }, 201);
});

export const restoreBrainDumpCanvas = asyncHandler(async (req, res) => {
  const brainDump = await getOwnedBrainDump(req.params.brainDumpId, req.user._id);
  const generatedCanvas = createCanvasArtifacts(brainDump.extracted, 0);
  await ensureCanvasIndexes();

  const canvas = await Canvas.findOneAndUpdate(
    { userId: req.user._id, brainDumpId: brainDump._id },
    {
      nodes: generatedCanvas.nodes,
      edges: generatedCanvas.edges,
      updatedAt: new Date(),
    },
    {
      returnDocument: "after",
      upsert: true,
      setDefaultsOnInsert: true,
      projection: "brainDumpId nodes edges updatedAt",
    }
  ).lean();

  apiResponse(res, canvas);
});
