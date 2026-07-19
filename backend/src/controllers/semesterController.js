import { createHash } from "node:crypto";
import AIHistory from "../models/AIHistory.js";
import BrainDump from "../models/BrainDump.js";
import Canvas, { ensureCanvasIndexes } from "../models/Canvas.js";
import Goal from "../models/Goal.js";
import Semester from "../models/Semester.js";
import Task from "../models/Task.js";
import { getSecondBrainMemory } from "../services/memoryService.js";
import { generateSemesterPlan, getOpenAIModel } from "../services/openaiService.js";
import ApiError from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const MAX_FILE_BYTES = 25 * 1024 * 1024;
const MAX_FILES = 6;
const validTypes = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/png",
  "image/jpeg",
]);

const today = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};

const addDays = (days) => {
  const date = today();
  date.setDate(date.getDate() + days);
  return date;
};

const dateOr = (value, fallback = null) => {
  if (!value) return fallback;
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? fallback : date;
};

const priority = (value) => (["low", "medium", "high"].includes(value) ? value : "medium");
const title = (value, fallback) => String(value || fallback).trim().slice(0, 180);

const normalizeSubjects = (subjects, manualSubjects = []) => {
  const source = Array.isArray(subjects) && subjects.length ? subjects : manualSubjects;
  return source.slice(0, 16).map((item, index) => ({
    id: String(item.id || `subject-${index + 1}`),
    name: title(item.name || item.title, `Subject ${index + 1}`),
    credits: Number.isFinite(Number(item.credits)) ? Number(item.credits) : 0,
    faculty: String(item.faculty || "").slice(0, 100),
    lectureDays: Array.isArray(item.lectureDays) ? item.lectureDays.slice(0, 7) : [],
    lectureTime: String(item.lectureTime || "").slice(0, 80),
    topics: Array.isArray(item.topics) ? item.topics.slice(0, 20).map(String) : [],
    difficulty: ["easy", "medium", "hard"].includes(item.difficulty) ? item.difficulty : "medium",
    priority: priority(item.priority),
  }));
};

const normalizeDatedItems = (items, type) => (Array.isArray(items) ? items : []).slice(0, 40).map((item, index) => ({
  id: String(item.id || `${type}-${index + 1}`),
  title: title(item.title || item.name, `${type} ${index + 1}`),
  subject: String(item.subject || item.relatedSubject || "").slice(0, 120),
  date: dateOr(item.date || item.dueDate),
  priority: priority(item.priority),
  status: ["pending", "completed", "overdue"].includes(item.status) ? item.status : "pending",
  progress: Math.max(0, Math.min(100, Number(item.progress) || 0)),
  type,
}));

const buildFallbackPlan = (manualEntry) => {
  const subjects = normalizeSubjects([], manualEntry.subjects || []);
  const assignments = normalizeDatedItems(manualEntry.assignments, "assignment");
  const projects = normalizeDatedItems(manualEntry.projects, "project");
  const exams = normalizeDatedItems(manualEntry.exams, "exam");
  const plannerTasks = [
    ...subjects.map((subject, index) => ({ title: `Study ${subject.name}`, date: addDays(index + 1), category: subject.name, priority: subject.difficulty === "hard" ? "high" : "medium", estimatedTime: subject.difficulty === "hard" ? 90 : 60, type: "task" })),
    ...assignments.map((item) => ({ title: `Complete ${item.title}`, date: item.date || addDays(7), category: item.subject || "Assignment", priority: item.priority, estimatedTime: 120, type: "deadline" })),
    ...projects.map((item) => ({ title: `Work on ${item.title}`, date: item.date || addDays(10), category: item.subject || "Project", priority: "high", estimatedTime: 120, type: "task" })),
    ...exams.map((item) => ({ title: `Revise for ${item.title}`, date: item.date ? new Date(item.date.getTime() - 2 * 86400000) : addDays(14), category: item.subject || "Exam", priority: "high", estimatedTime: 90, type: "task" })),
  ];
  return { semesterName: manualEntry.semester || "My Semester", subjects, assignments, projects, exams, plannerTasks, goals: subjects.map((subject) => ({ title: `Complete ${subject.name}`, category: "Semester", priority: subject.priority })), studyPlan: plannerTasks, revisionPlan: exams.map((exam) => ({ title: `Revision: ${exam.title}`, date: exam.date, subject: exam.subject })), upcomingEvents: [...assignments, ...projects, ...exams], calendar: [...assignments, ...projects, ...exams], knowledgeGraph: {} };
};

const normalizePlan = (raw, manualEntry) => {
  const fallback = buildFallbackPlan(manualEntry);
  const subjects = normalizeSubjects(raw?.subjects, manualEntry.subjects || []);
  const assignments = normalizeDatedItems(raw?.assignments?.length ? raw.assignments : manualEntry.assignments, "assignment");
  const projects = normalizeDatedItems(raw?.projects?.length ? raw.projects : manualEntry.projects, "project");
  const exams = normalizeDatedItems(raw?.exams?.length ? raw.exams : manualEntry.exams, "exam");
  const normalizeTasks = (tasks) => (Array.isArray(tasks) ? tasks : []).slice(0, 120).map((item, index) => ({
    title: title(item.title || item.name, `Study task ${index + 1}`),
    date: dateOr(item.date || item.dueDate, addDays(Math.min(index + 1, 21))),
    category: String(item.category || item.relatedSubject || "Study").slice(0, 80),
    priority: priority(item.priority),
    estimatedTime: Math.max(15, Math.min(360, Number(item.estimatedTime) || 60)),
    type: ["task", "deadline", "milestone"].includes(item.type) ? item.type : "task",
  }));
  const plannerTasks = normalizeTasks(raw?.plannerTasks?.length ? raw.plannerTasks : fallback.plannerTasks);
  const goals = (Array.isArray(raw?.goals) && raw.goals.length ? raw.goals : fallback.goals).slice(0, 24).map((item, index) => ({
    title: title(item.title || item.name, `Semester goal ${index + 1}`),
    description: String(item.description || "").slice(0, 1000),
    category: String(item.category || "Semester").slice(0, 80),
    priority: priority(item.priority),
    dueDate: dateOr(item.dueDate),
  }));
  const dated = (items, fallbackItems = []) => normalizeDatedItems(items?.length ? items : fallbackItems, "event");
  return {
    semesterName: title(raw?.semesterName || manualEntry.semester, "My Semester"), subjects, assignments, projects, exams, plannerTasks, goals,
    studyPlan: normalizeTasks(raw?.studyPlan?.length ? raw.studyPlan : fallback.studyPlan),
    revisionPlan: normalizeTasks(raw?.revisionPlan?.length ? raw.revisionPlan : fallback.revisionPlan),
    upcomingEvents: dated(raw?.upcomingEvents, [...assignments, ...projects, ...exams]),
    calendar: dated(raw?.calendar, [...assignments, ...projects, ...exams]),
  };
};

const buildGraph = (plan) => {
  const rootId = "semester-root";
  const nodes = [{ id: rootId, label: plan.semesterName, type: "goal", meta: "Semester" }];
  const edges = [];
  const append = (items, type, prefix) => items.forEach((item, index) => {
    const id = `${prefix}-${index}`;
    nodes.push({ id, label: item.name || item.title, type, meta: item.subject || item.difficulty || type });
    edges.push({ source: rootId, target: id, label: type === "resource" ? "contains" : "plans" });
  });
  append(plan.subjects, "resource", "subject");
  append(plan.assignments, "task", "assignment");
  append(plan.projects, "goal", "project");
  append(plan.exams, "deadline", "exam");
  return { nodes, edges };
};

const sanitizeDocuments = (documents) => {
  if (!Array.isArray(documents) || documents.length > MAX_FILES) throw new ApiError(400, `Upload up to ${MAX_FILES} documents.`, "INVALID_DOCUMENTS");
  return documents.map((item) => {
    const name = String(item.name || "").trim().slice(0, 180);
    const type = String(item.type || "").toLowerCase();
    const base64 = String(item.base64 || "").replace(/^data:[^;]+;base64,/, "");
    if (!name || !validTypes.has(type) || !base64 || !/^[a-z0-9+/=\s]+$/i.test(base64)) throw new ApiError(400, "Each upload must be a PDF, DOCX, PNG, JPG, or JPEG file.", "INVALID_DOCUMENT");
    const size = Buffer.byteLength(base64, "base64");
    if (size > MAX_FILE_BYTES) throw new ApiError(400, "Each file must be 25 MB or smaller.", "FILE_TOO_LARGE");
    return { name, type, base64, size };
  });
};

const createSemesterCanvas = async (userId, plan, graph) => {
  const brainDump = await BrainDump.create({
    userId,
    title: `${plan.semesterName} — Semester Copilot`.slice(0, 120),
    input: `Semester Copilot plan for ${plan.semesterName}`,
    extracted: { subjects: plan.subjects.map((item) => ({ title: item.name, priority: item.priority })), projects: plan.projects, exams: plan.exams },
  });
  await ensureCanvasIndexes();
  const canvas = await Canvas.create({
    userId,
    brainDumpId: brainDump._id,
    nodes: graph.nodes.map((node, index) => ({ id: node.id, type: node.type, label: node.label, position: { x: 100 + (index % 4) * 280, y: 100 + Math.floor(index / 4) * 160 }, data: { label: node.label, meta: node.meta, priority: "medium" } })),
    edges: graph.edges.map((edge, index) => ({ id: `semester-edge-${index}`, source: edge.source, target: edge.target, label: edge.label, animated: true })),
  });
  return { brainDump, canvas };
};

export const getSemesters = asyncHandler(async (req, res) => {
  const items = await Semester.find({ userId: req.user._id }).sort({ updatedAt: -1 }).limit(20).lean();
  apiResponse(res, { items });
});

export const getSemester = asyncHandler(async (req, res) => {
  const semester = await Semester.findOne({ _id: req.params.id, userId: req.user._id }).lean();
  if (!semester) throw new ApiError(404, "Semester plan not found.", "SEMESTER_NOT_FOUND");
  apiResponse(res, semester);
});

export const generateSemester = asyncHandler(async (req, res) => {
  const manualEntry = req.body.manualEntry && typeof req.body.manualEntry === "object" ? req.body.manualEntry : {};
  const documents = sanitizeDocuments(req.body.documents || []);
  if (!String(manualEntry.semester || "").trim() && !documents.length && !(manualEntry.subjects || []).length) throw new ApiError(400, "Add semester details or upload a document before generating.", "SEMESTER_INPUT_REQUIRED");
  const inputHash = createHash("sha256").update(JSON.stringify({ manualEntry, documents: documents.map(({ name, type, base64 }) => ({ name, type, base64 })) })).digest("hex");
  const cached = await Semester.findOne({ userId: req.user._id, inputHash }).lean();
  if (cached) return apiResponse(res, { semester: cached, cached: true });

  const memory = await getSecondBrainMemory(req.user._id);
  let rawPlan;
  let ai;
  try {
    rawPlan = await generateSemesterPlan({ manualEntry, documents, memory });
    ai = { provider: "openai", model: getOpenAIModel(), fallback: false };
  } catch (error) {
    console.warn("[Semester Copilot] Using local plan", { code: error?.code, message: error?.message });
    rawPlan = buildFallbackPlan(manualEntry);
    ai = { provider: "local", fallback: true, warning: "AI analysis was unavailable, so this plan uses the details entered manually." };
  }
  const plan = normalizePlan(rawPlan, manualEntry);
  const graph = buildGraph(plan);
  const [createdGoals, createdTasks, canvasData] = await Promise.all([
    Goal.insertMany(plan.goals.map((goal) => ({ userId: req.user._id, ...goal, progress: 0, status: "active" }))),
    Task.insertMany(plan.plannerTasks.map((task) => ({ userId: req.user._id, title: task.title, date: task.date, category: task.category, tag: "Semester Copilot", priority: task.priority, type: task.type, estimatedTime: task.estimatedTime, source: "semester-copilot", completed: false, progress: 0 }))),
    createSemesterCanvas(req.user._id, plan, graph),
  ]);
  const semester = await Semester.create({
    userId: req.user._id, name: plan.semesterName, inputHash, manualEntry,
    uploads: documents.map(({ name, type, size }) => ({ name, type, size })),
    subjects: plan.subjects, assignments: plan.assignments, projects: plan.projects, exams: plan.exams,
    calendar: plan.calendar, studyPlan: plan.studyPlan, revisionPlan: plan.revisionPlan, goals: plan.goals,
    upcomingEvents: plan.upcomingEvents, knowledgeGraph: graph, generatedTaskIds: createdTasks.map((item) => item._id), generatedGoalIds: createdGoals.map((item) => item._id),
    brainDumpId: canvasData.brainDump._id, canvasId: canvasData.canvas._id, ai,
  });
  await AIHistory.create({ userId: req.user._id, action: "semester-copilot", input: plan.semesterName, output: { semesterId: semester._id, taskCount: createdTasks.length, goalCount: createdGoals.length } });
  apiResponse(res, { semester, created: { goals: createdGoals, tasks: createdTasks }, cached: false }, 201);
});

export const updateAssignment = asyncHandler(async (req, res) => {
  const semester = await Semester.findOne({ _id: req.params.id, userId: req.user._id });
  if (!semester) throw new ApiError(404, "Semester plan not found.", "SEMESTER_NOT_FOUND");
  const assignment = semester.assignments.find((item) => String(item.id) === req.params.assignmentId);
  if (!assignment) throw new ApiError(404, "Assignment not found.", "ASSIGNMENT_NOT_FOUND");
  if (req.body.status) assignment.status = req.body.status;
  if (req.body.progress !== undefined) assignment.progress = Math.max(0, Math.min(100, Number(req.body.progress) || 0));
  if (req.body.title) assignment.title = title(req.body.title, assignment.title);
  if (req.body.date) assignment.date = dateOr(req.body.date, assignment.date);
  if (assignment.status === "completed") assignment.progress = 100;
  semester.markModified("assignments");
  await semester.save();
  apiResponse(res, semester);
});
