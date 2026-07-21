import { createHash, randomUUID } from "node:crypto";
import AIHistory from "../models/AIHistory.js";
import Goal from "../models/Goal.js";
import Semester from "../models/Semester.js";
import Task from "../models/Task.js";
import { createNotification } from "../services/notificationService.js";
import ApiError from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const asArray = (value) => Array.isArray(value) ? value : [];
const cleanText = (value, fallback = "") => String(value ?? fallback).trim().slice(0, 180);
const validDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? null : date;
};
const startOfDay = (date = new Date()) => { const next = new Date(date); next.setHours(0, 0, 0, 0); return next; };
const addDays = (date, days) => { const next = new Date(date); next.setDate(next.getDate() + days); return next; };
const isoDay = (date) => startOfDay(date).toISOString();
const difficultyHours = { easy: 60, medium: 90, hard: 120 };

const normalizeSubjects = (subjects) => asArray(subjects).slice(0, 16).map((item, index) => ({
  id: cleanText(item?.id, `subject-${index + 1}`) || `subject-${index + 1}`,
  name: cleanText(item?.name, `Subject ${index + 1}`),
  examDate: validDate(item?.examDate),
  internalExamDate: validDate(item?.internalExamDate),
  assignmentDeadline: validDate(item?.assignmentDeadline),
  projectDeadline: validDate(item?.projectDeadline),
  difficulty: ["easy", "medium", "hard"].includes(item?.difficulty) ? item.difficulty : "medium",
  credits: Math.max(0, Math.min(50, Number(item?.credits) || 0)),
})).filter((item) => item.name);

const createItem = (type, subject, date, title) => ({
  id: `${type}-${randomUUID()}`,
  title,
  subject: subject.name,
  date,
  priority: subject.difficulty === "hard" ? "high" : "medium",
  status: "pending",
  progress: 0,
  type,
});

const buildTimetable = (subjects) => {
  const today = startOfDay();
  const weighted = subjects.flatMap((subject) => Array(subject.difficulty === "hard" ? 3 : subject.difficulty === "medium" ? 2 : 1).fill(subject));
  const studyPlan = [];
  const calendar = [];
  if (!weighted.length) return { studyPlan, calendar, revisionPlan: [] };

  for (let offset = 0; offset < 28; offset += 1) {
    const subject = weighted[offset % weighted.length];
    const date = addDays(today, offset);
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const item = {
      id: `study-${offset + 1}`,
      title: `${offset % 7 === 6 ? "Weekly review" : "Study"}: ${subject.name}`,
      subject: subject.name,
      date: isoDay(date),
      day: date.toLocaleDateString("en-US", { weekday: "short" }),
      startTime: isWeekend ? "10:00" : "18:00",
      estimatedTime: offset % 7 === 6 ? Math.min(150, difficultyHours[subject.difficulty] + 30) : difficultyHours[subject.difficulty],
      category: offset % 7 === 6 ? "Revision" : "Study",
      type: offset % 7 === 6 ? "revision" : "study",
    };
    studyPlan.push(item);
    calendar.push(item);
  }
  const revisionPlan = subjects.flatMap((subject) => [subject.internalExamDate, subject.examDate].filter(Boolean).flatMap((examDate) => [14, 7, 2].map((daysBefore) => {
    const date = addDays(examDate, -daysBefore);
    return { id: `revision-${subject.id}-${daysBefore}-${examDate.getTime()}`, title: `Revision: ${subject.name}`, subject: subject.name, date: isoDay(date), estimatedTime: difficultyHours[subject.difficulty], category: "Revision", type: "revision" };
  }))).sort((a, b) => new Date(a.date) - new Date(b.date));
  return { studyPlan, calendar, revisionPlan };
};

const buildSemester = (manualEntry) => {
  const subjects = normalizeSubjects(manualEntry.subjects);
  const assignments = subjects.filter((subject) => subject.assignmentDeadline).map((subject) => createItem("assignment", subject, subject.assignmentDeadline, `${subject.name} assignment`));
  const projects = subjects.filter((subject) => subject.projectDeadline).map((subject) => createItem("project", subject, subject.projectDeadline, `${subject.name} project`));
  const exams = subjects.flatMap((subject) => [
    subject.internalExamDate && createItem("internal-exam", subject, subject.internalExamDate, `${subject.name} internal exam`),
    subject.examDate && createItem("exam", subject, subject.examDate, `${subject.name} exam`),
  ].filter(Boolean));
  const timetable = buildTimetable(subjects);
  const plannerTasks = [
    ...assignments.map((item) => ({ title: `Complete ${item.title}`, date: item.date, category: item.subject, priority: item.priority, estimatedTime: 120, type: "deadline" })),
    ...projects.map((item) => ({ title: `Work on ${item.title}`, date: item.date, category: item.subject, priority: "high", estimatedTime: 150, type: "deadline" })),
    ...timetable.revisionPlan.map((item) => ({ title: item.title, date: item.date, category: item.subject, priority: "high", estimatedTime: item.estimatedTime, type: "task" })),
  ];
  return {
    name: cleanText(manualEntry.semester, "My Semester"), subjects, assignments, projects, exams,
    ...timetable, plannerTasks,
    goals: subjects.map((subject) => ({ title: `Complete ${subject.name}`, category: "Semester", priority: subject.difficulty === "hard" ? "high" : "medium" })),
  };
};

const findItem = (semester, type, itemId) => {
  const field = type === "exam" ? "exams" : type === "assignment" ? "assignments" : "projects";
  const items = asArray(semester[field]);
  const item = items.find((candidate) => String(candidate.id) === itemId);
  return { field, items, item };
};

export const getSemesters = asyncHandler(async (req, res) => {
  const items = await Semester.find({ userId: req.user._id }).sort({ updatedAt: -1 }).limit(20).lean();
  apiResponse(res, { items: asArray(items) });
});

export const getSemester = asyncHandler(async (req, res) => {
  const semester = await Semester.findOne({ _id: req.params.id, userId: req.user._id }).lean();
  if (!semester) throw new ApiError(404, "Semester plan not found.", "SEMESTER_NOT_FOUND");
  apiResponse(res, semester);
});

export const generateSemester = asyncHandler(async (req, res) => {
  const manualEntry = req.body.manualEntry && typeof req.body.manualEntry === "object" ? req.body.manualEntry : {};
  if (!cleanText(manualEntry.semester) || !asArray(manualEntry.subjects).length) throw new ApiError(400, "Add a semester name and at least one subject.", "SEMESTER_INPUT_REQUIRED");
  const plan = buildSemester(manualEntry);
  if (!plan.subjects.length) throw new ApiError(400, "Every subject needs a name.", "SEMESTER_SUBJECTS_REQUIRED");
  const inputHash = createHash("sha256").update(JSON.stringify({ semester: plan.name, subjects: plan.subjects, createdAt: Date.now() })).digest("hex");
  await Semester.updateMany({ userId: req.user._id, status: "active" }, { status: "archived" });
  const [goals, tasks] = await Promise.all([
    Goal.insertMany(plan.goals.map((goal) => ({ userId: req.user._id, ...goal, progress: 0, status: "active" }))),
    Task.insertMany(plan.plannerTasks.map((task) => ({ userId: req.user._id, ...task, tag: "Semester Copilot", source: "semester-copilot", completed: false, progress: 0 }))),
  ]);
  const semester = await Semester.create({
    userId: req.user._id, name: plan.name, inputHash, manualEntry: { semester: plan.name, subjects: plan.subjects },
    subjects: plan.subjects, assignments: plan.assignments, projects: plan.projects, exams: plan.exams,
    calendar: plan.calendar, studyPlan: plan.studyPlan, revisionPlan: plan.revisionPlan, goals: plan.goals,
    upcomingEvents: [...plan.assignments, ...plan.projects, ...plan.exams], generatedTaskIds: tasks.map((task) => task._id), generatedGoalIds: goals.map((goal) => goal._id),
    ai: { provider: "guided-setup", fallback: false },
  });
  const [, notification] = await Promise.all([
    AIHistory.create({ userId: req.user._id, action: "semester-copilot", input: plan.name, output: { semesterId: semester._id, taskCount: tasks.length, goalCount: goals.length } }),
    createNotification({ userId: req.user._id, type: "semester", title: "Semester ready", message: `${plan.name} is set up. Your Study Timetable is ready.`, resourceType: "semester", resourceId: String(semester._id), dedupeKey: `semester-created:${semester._id}` }),
  ]);
  apiResponse(res, { semester, created: { goals, tasks }, notification, cached: false }, 201);
});

export const addSemesterItem = asyncHandler(async (req, res) => {
  const semester = await Semester.findOne({ _id: req.params.id, userId: req.user._id });
  if (!semester) throw new ApiError(404, "Semester plan not found.", "SEMESTER_NOT_FOUND");
  const type = req.params.type;
  if (!["exam", "assignment", "project"].includes(type)) throw new ApiError(400, "Unsupported semester item.", "INVALID_SEMESTER_ITEM");
  const subjectName = cleanText(req.body.subject);
  const subject = asArray(semester.subjects).find((item) => item.name === subjectName) || { name: subjectName || "General", difficulty: "medium" };
  const date = validDate(req.body.date);
  if (!date) throw new ApiError(400, "A valid date is required.", "INVALID_DATE");
  const item = createItem(type, subject, date, cleanText(req.body.title, `${subject.name} ${type}`));
  const field = type === "exam" ? "exams" : `${type}s`;
  semester[field] = [...asArray(semester[field]), item];
  semester.upcomingEvents = [...asArray(semester.upcomingEvents), item];
  semester.markModified(field); semester.markModified("upcomingEvents");
  await semester.save();
  apiResponse(res, semester);
});

export const updateSemesterItem = asyncHandler(async (req, res) => {
  const semester = await Semester.findOne({ _id: req.params.id, userId: req.user._id });
  if (!semester) throw new ApiError(404, "Semester plan not found.", "SEMESTER_NOT_FOUND");
  const { field, item } = findItem(semester, req.params.type, req.params.itemId);
  if (!item) throw new ApiError(404, "Semester item not found.", "SEMESTER_ITEM_NOT_FOUND");
  if (req.body.title !== undefined) item.title = cleanText(req.body.title, item.title);
  if (req.body.subject !== undefined) item.subject = cleanText(req.body.subject, item.subject);
  if (req.body.date !== undefined) { const date = validDate(req.body.date); if (!date) throw new ApiError(400, "A valid date is required.", "INVALID_DATE"); item.date = date; }
  if (req.body.status !== undefined) item.status = ["pending", "completed", "overdue"].includes(req.body.status) ? req.body.status : item.status;
  if (req.body.status === "completed") item.progress = 100;
  semester.markModified(field);
  await semester.save();
  apiResponse(res, semester);
});

export const deleteSemesterItem = asyncHandler(async (req, res) => {
  const semester = await Semester.findOne({ _id: req.params.id, userId: req.user._id });
  if (!semester) throw new ApiError(404, "Semester plan not found.", "SEMESTER_NOT_FOUND");
  const { field, items, item } = findItem(semester, req.params.type, req.params.itemId);
  if (!item) throw new ApiError(404, "Semester item not found.", "SEMESTER_ITEM_NOT_FOUND");
  semester[field] = items.filter((candidate) => String(candidate.id) !== req.params.itemId);
  semester.upcomingEvents = asArray(semester.upcomingEvents).filter((candidate) => String(candidate.id) !== req.params.itemId);
  semester.markModified(field); semester.markModified("upcomingEvents");
  await semester.save();
  apiResponse(res, semester);
});
