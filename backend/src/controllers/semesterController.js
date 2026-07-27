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
const addDays = (date, days) => { const next = new Date(date); next.setDate(next.getDate() + days); return next; };
const isoDay = (date) => { const next = new Date(date); next.setHours(0, 0, 0, 0); return next.toISOString(); };
const difficultyHours = { easy: 60, medium: 90, hard: 120 };

const normalizeSubjects = (subjects) => asArray(subjects).slice(0, 16).map((item, index) => ({
  id: cleanText(item?.id, `subject-${randomUUID()}`) || `subject-${index + 1}`,
  name: cleanText(item?.name, `Subject ${index + 1}`),
  examDate: validDate(item?.examDate),
  internalExamDate: validDate(item?.internalExamDate),
  assignmentDeadline: validDate(item?.assignmentDeadline),
  projectDeadline: validDate(item?.projectDeadline),
  difficulty: ["easy", "medium", "hard"].includes(item?.difficulty) ? item.difficulty : "medium",
  credits: Math.max(0, Math.min(50, Number(item?.credits) || 0)),
})).filter((item) => item.name);

const createItem = (type, subject, date, title, generated = false) => ({
  id: `${type}-${randomUUID()}`,
  title,
  subject: subject.name,
  subjectId: subject.id || "",
  date,
  priority: subject.difficulty === "hard" ? "high" : "medium",
  status: "pending",
  progress: 0,
  type,
  generated,
});

const itemField = (type) => type === "exam" ? "exams" : `${type}s`;
const plannerTaskForItem = (item) => ({
  title: item.type === "exam" || item.type === "internal-exam" ? `Prepare for ${item.title}` : `Complete ${item.title}`,
  date: item.date,
  category: item.subject,
  priority: item.priority || "medium",
  estimatedTime: item.type === "project" ? 150 : item.type === "exam" || item.type === "internal-exam" ? 120 : 120,
  type: item.type === "exam" || item.type === "internal-exam" ? "task" : "deadline",
});

const revisionItemsForSubject = (subject) => [subject.internalExamDate, subject.examDate]
  .filter(Boolean)
  .flatMap((examDate) => [14, 7, 2].map((daysBefore) => ({
    id: `revision-${subject.id}-${daysBefore}-${new Date(examDate).getTime()}`,
    subjectId: subject.id,
    title: `Revision: ${subject.name}`,
    subject: subject.name,
    date: isoDay(addDays(examDate, -daysBefore)),
    estimatedTime: difficultyHours[subject.difficulty],
    category: "Revision",
    type: "revision",
  })));

const generatedItemsForSubject = (subject) => [
  subject.internalExamDate && createItem("internal-exam", subject, subject.internalExamDate, `${subject.name} internal exam`, true),
  subject.examDate && createItem("exam", subject, subject.examDate, `${subject.name} exam`, true),
  subject.assignmentDeadline && createItem("assignment", subject, subject.assignmentDeadline, `${subject.name} assignment`, true),
  subject.projectDeadline && createItem("project", subject, subject.projectDeadline, `${subject.name} project`, true),
].filter(Boolean);

const splitItems = (items) => ({
  exams: items.filter((item) => item.type === "exam" || item.type === "internal-exam"),
  assignments: items.filter((item) => item.type === "assignment"),
  projects: items.filter((item) => item.type === "project"),
});

const makeSemesterNotification = (userId, semester, message = "Semester information was updated.") => createNotification({
  userId,
  type: "semester",
  title: "Semester updated",
  message,
  resourceType: "semester",
  resourceId: String(semester._id),
});

const responseWithSemester = async (res, userId, semester, message) => {
  const notification = await makeSemesterNotification(userId, semester, message);
  apiResponse(res, { semester, notification });
};

const upsertPlannerTask = async (userId, semester, item) => {
  const task = plannerTaskForItem(item);
  return Task.findOneAndUpdate(
    { userId, semesterId: semester._id, semesterItemId: item.id },
    { $set: { ...task, tag: "Semester Copilot", source: "semester-copilot", completed: item.status === "completed", progress: item.progress || 0 } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
};

const replaceGeneratedSubjectData = async (userId, semester, subject) => {
  const oldItems = ["exams", "assignments", "projects"].flatMap((field) => asArray(semester[field]).filter((item) => item.subjectId === subject.id && item.generated));
  const oldIds = oldItems.map((item) => item.id);
  ["exams", "assignments", "projects"].forEach((field) => {
    semester[field] = asArray(semester[field]).filter((item) => item.subjectId !== subject.id || !item.generated);
    semester.markModified(field);
  });
  semester.revisionPlan = asArray(semester.revisionPlan).filter((item) => item.subjectId !== subject.id);
  const generated = generatedItemsForSubject(subject);
  const grouped = splitItems(generated);
  semester.exams = [...asArray(semester.exams), ...grouped.exams];
  semester.assignments = [...asArray(semester.assignments), ...grouped.assignments];
  semester.projects = [...asArray(semester.projects), ...grouped.projects];
  const revisions = revisionItemsForSubject(subject);
  semester.revisionPlan = [...asArray(semester.revisionPlan), ...revisions];
  semester.upcomingEvents = [...asArray(semester.assignments), ...asArray(semester.projects), ...asArray(semester.exams)];
  semester.markModified("revisionPlan");
  semester.markModified("upcomingEvents");
  if (oldIds.length) await Task.deleteMany({ userId, semesterId: semester._id, semesterItemId: { $in: oldIds } });
  await Task.deleteMany({ userId, semesterId: semester._id, revisionSubjectId: subject.id });
  const tasks = await Promise.all([
    ...generated.map((item) => upsertPlannerTask(userId, semester, item)),
    ...revisions.map((item) => Task.create({ userId, semesterId: semester._id, revisionSubjectId: subject.id, title: item.title, date: item.date, category: item.subject, priority: "high", estimatedTime: item.estimatedTime, type: "task", tag: "Semester Copilot", source: "semester-copilot" })),
  ]);
  return tasks;
};

const findItem = (semester, type, itemId) => {
  const field = itemField(type);
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
  const subjects = normalizeSubjects(manualEntry.subjects);
  const name = cleanText(manualEntry.semester, "My Semester");
  if (!name || !subjects.length) throw new ApiError(400, "Add a semester name and at least one subject.", "SEMESTER_INPUT_REQUIRED");
  const inputHash = createHash("sha256").update(JSON.stringify({ name, subjects, createdAt: Date.now() })).digest("hex");
  await Semester.updateMany({ userId: req.user._id, status: "active" }, { status: "archived" });
  const semester = await Semester.create({ userId: req.user._id, name, inputHash, manualEntry: { semester: name, subjects }, subjects, collegeTimetable: [] });
  const allItems = subjects.flatMap(generatedItemsForSubject);
  const grouped = splitItems(allItems);
  semester.exams = grouped.exams;
  semester.assignments = grouped.assignments;
  semester.projects = grouped.projects;
  semester.revisionPlan = subjects.flatMap(revisionItemsForSubject);
  semester.upcomingEvents = allItems;
  const [goals, generatedTasks] = await Promise.all([
    Goal.insertMany(subjects.map((subject) => ({ userId: req.user._id, title: `Complete ${subject.name}`, category: "Semester", priority: subject.difficulty === "hard" ? "high" : "medium", progress: 0, status: "active" }))),
    Promise.all([
      ...allItems.map((item) => upsertPlannerTask(req.user._id, semester, item)),
      ...semester.revisionPlan.map((item) => Task.create({ userId: req.user._id, semesterId: semester._id, revisionSubjectId: item.subjectId, title: item.title, date: item.date, category: item.subject, priority: "high", estimatedTime: item.estimatedTime, type: "task", tag: "Semester Copilot", source: "semester-copilot" })),
    ]),
  ]);
  semester.generatedTaskIds = generatedTasks.map((task) => task._id);
  semester.generatedGoalIds = goals.map((goal) => goal._id);
  await semester.save();
  const [, notification] = await Promise.all([
    AIHistory.create({ userId: req.user._id, action: "semester-copilot", input: name, output: { semesterId: semester._id, taskCount: generatedTasks.length, goalCount: goals.length } }),
    createNotification({ userId: req.user._id, type: "semester", title: "Semester ready", message: `${name} is set up. Add your College Timetable whenever you are ready.`, resourceType: "semester", resourceId: String(semester._id) }),
  ]);
  apiResponse(res, { semester, created: { goals, tasks: generatedTasks }, notification, cached: false }, 201);
});

export const updateSemester = asyncHandler(async (req, res) => {
  const semester = await Semester.findOne({ _id: req.params.id, userId: req.user._id });
  if (!semester) throw new ApiError(404, "Semester plan not found.", "SEMESTER_NOT_FOUND");
  semester.name = cleanText(req.body.name, semester.name);
  await semester.save();
  await responseWithSemester(res, req.user._id, semester, `${semester.name} was renamed.`);
});

export const deleteSemester = asyncHandler(async (req, res) => {
  const semester = await Semester.findOne({ _id: req.params.id, userId: req.user._id });
  if (!semester) throw new ApiError(404, "Semester plan not found.", "SEMESTER_NOT_FOUND");
  await Promise.all([
    Task.deleteMany({ userId: req.user._id, semesterId: semester._id }),
    Goal.deleteMany({ _id: { $in: asArray(semester.generatedGoalIds) }, userId: req.user._id }),
    Semester.deleteOne({ _id: semester._id }),
  ]);
  apiResponse(res, { deleted: true, id: req.params.id });
});

export const addSubject = asyncHandler(async (req, res) => {
  const semester = await Semester.findOne({ _id: req.params.id, userId: req.user._id });
  if (!semester) throw new ApiError(404, "Semester plan not found.", "SEMESTER_NOT_FOUND");
  const [subject] = normalizeSubjects([{ ...req.body, id: `subject-${randomUUID()}` }]);
  if (!subject?.name) throw new ApiError(400, "A subject name is required.", "SEMESTER_SUBJECT_REQUIRED");
  semester.subjects = [...asArray(semester.subjects), subject];
  semester.markModified("subjects");
  const tasks = await replaceGeneratedSubjectData(req.user._id, semester, subject);
  semester.generatedTaskIds = [...asArray(semester.generatedTaskIds), ...tasks.map((task) => task._id)];
  await semester.save();
  await responseWithSemester(res, req.user._id, semester, `${subject.name} was added to ${semester.name}.`);
});

export const updateSubject = asyncHandler(async (req, res) => {
  const semester = await Semester.findOne({ _id: req.params.id, userId: req.user._id });
  if (!semester) throw new ApiError(404, "Semester plan not found.", "SEMESTER_NOT_FOUND");
  const previous = asArray(semester.subjects).find((subject) => subject.id === req.params.subjectId);
  if (!previous) throw new ApiError(404, "Subject not found.", "SUBJECT_NOT_FOUND");
  const [subject] = normalizeSubjects([{ ...previous, ...req.body, id: previous.id }]);
  semester.subjects = asArray(semester.subjects).map((item) => item.id === previous.id ? subject : item);
  semester.markModified("subjects");
  const tasks = await replaceGeneratedSubjectData(req.user._id, semester, subject);
  semester.generatedTaskIds = [...asArray(semester.generatedTaskIds).filter(Boolean), ...tasks.map((task) => task._id)];
  await semester.save();
  await responseWithSemester(res, req.user._id, semester, `${subject.name} was updated.`);
});

export const deleteSubject = asyncHandler(async (req, res) => {
  const semester = await Semester.findOne({ _id: req.params.id, userId: req.user._id });
  if (!semester) throw new ApiError(404, "Semester plan not found.", "SEMESTER_NOT_FOUND");
  const subject = asArray(semester.subjects).find((item) => item.id === req.params.subjectId);
  if (!subject) throw new ApiError(404, "Subject not found.", "SUBJECT_NOT_FOUND");
  const removedIds = ["exams", "assignments", "projects"].flatMap((field) => asArray(semester[field]).filter((item) => item.subjectId === subject.id).map((item) => item.id));
  semester.subjects = asArray(semester.subjects).filter((item) => item.id !== subject.id);
  ["exams", "assignments", "projects"].forEach((field) => { semester[field] = asArray(semester[field]).filter((item) => item.subjectId !== subject.id); semester.markModified(field); });
  semester.revisionPlan = asArray(semester.revisionPlan).filter((item) => item.subjectId !== subject.id);
  semester.upcomingEvents = [...asArray(semester.assignments), ...asArray(semester.projects), ...asArray(semester.exams)];
  semester.markModified("subjects"); semester.markModified("revisionPlan"); semester.markModified("upcomingEvents");
  await Promise.all([Task.deleteMany({ userId: req.user._id, semesterId: semester._id, $or: [{ semesterItemId: { $in: removedIds } }, { revisionSubjectId: subject.id }] }), semester.save()]);
  await responseWithSemester(res, req.user._id, semester, `${subject.name} and its generated deadlines were removed.`);
});

export const addSemesterItem = asyncHandler(async (req, res) => {
  const semester = await Semester.findOne({ _id: req.params.id, userId: req.user._id });
  if (!semester) throw new ApiError(404, "Semester plan not found.", "SEMESTER_NOT_FOUND");
  const subject = asArray(semester.subjects).find((item) => item.name === cleanText(req.body.subject)) || { id: "", name: cleanText(req.body.subject, "General"), difficulty: "medium" };
  const date = validDate(req.body.date);
  if (!date) throw new ApiError(400, "A valid date is required.", "INVALID_DATE");
  const item = createItem(req.params.type, subject, date, cleanText(req.body.title, `${subject.name} ${req.params.type}`));
  const field = itemField(req.params.type);
  semester[field] = [...asArray(semester[field]), item];
  semester.upcomingEvents = [...asArray(semester.upcomingEvents), item];
  semester.markModified(field); semester.markModified("upcomingEvents");
  const task = await upsertPlannerTask(req.user._id, semester, item);
  semester.generatedTaskIds = [...asArray(semester.generatedTaskIds), task._id];
  await semester.save();
  await responseWithSemester(res, req.user._id, semester, `${item.title} was added to Planner.`);
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
  await upsertPlannerTask(req.user._id, semester, item);
  await semester.save();
  await responseWithSemester(res, req.user._id, semester, `${item.title} was updated.`);
});

export const deleteSemesterItem = asyncHandler(async (req, res) => {
  const semester = await Semester.findOne({ _id: req.params.id, userId: req.user._id });
  if (!semester) throw new ApiError(404, "Semester plan not found.", "SEMESTER_NOT_FOUND");
  const { field, items, item } = findItem(semester, req.params.type, req.params.itemId);
  if (!item) throw new ApiError(404, "Semester item not found.", "SEMESTER_ITEM_NOT_FOUND");
  semester[field] = items.filter((candidate) => String(candidate.id) !== req.params.itemId);
  semester.upcomingEvents = asArray(semester.upcomingEvents).filter((candidate) => String(candidate.id) !== req.params.itemId);
  semester.markModified(field); semester.markModified("upcomingEvents");
  await Promise.all([Task.deleteMany({ userId: req.user._id, semesterId: semester._id, semesterItemId: item.id }), semester.save()]);
  await responseWithSemester(res, req.user._id, semester, `${item.title} was removed from Planner.`);
});

const timetableDays = new Set(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]);
const timetableTime = /^([01][0-9]|2[0-3]):[0-5][0-9]$/;

const timetableEntry = (input, id = `lecture-${randomUUID()}`) => {
  const lecture = {
    id,
    day: cleanText(input.day),
    startTime: cleanText(input.startTime).slice(0, 5),
    endTime: cleanText(input.endTime).slice(0, 5),
    subject: cleanText(input.subject).slice(0, 120),
    room: cleanText(input.room).slice(0, 120),
    faculty: cleanText(input.faculty).slice(0, 120),
  };
  const details = [];
  if (!timetableDays.has(lecture.day)) details.push({ field: "day", message: "Choose a valid weekday." });
  if (!timetableTime.test(lecture.startTime)) details.push({ field: "startTime", message: "Start time must use HH:MM (24-hour) format." });
  if (!timetableTime.test(lecture.endTime)) details.push({ field: "endTime", message: "End time must use HH:MM (24-hour) format." });
  if (!lecture.subject) details.push({ field: "subject", message: "Subject is required." });
  if (timetableTime.test(lecture.startTime) && timetableTime.test(lecture.endTime) && lecture.startTime >= lecture.endTime) details.push({ field: "endTime", message: "End time must be later than start time." });
  if (details.length) throw new ApiError(400, details[0].message, "INVALID_TIMETABLE_LECTURE", details);
  return lecture;
};

export const addTimetableLecture = asyncHandler(async (req, res) => {
  const semester = await Semester.findOne({ _id: req.params.id, userId: req.user._id });
  if (!semester) throw new ApiError(404, "Semester plan not found.", "SEMESTER_NOT_FOUND");
  if (asArray(semester.collegeTimetable).length >= 200) throw new ApiError(400, "A semester can contain at most 200 timetable lectures.", "TIMETABLE_LIMIT_REACHED");
  const lecture = timetableEntry(req.body);
  semester.collegeTimetable = [...asArray(semester.collegeTimetable), lecture];
  semester.markModified("collegeTimetable");
  await semester.save();
  await responseWithSemester(res, req.user._id, semester, "College Timetable updated.");
});

export const updateTimetableLecture = asyncHandler(async (req, res) => {
  const semester = await Semester.findOne({ _id: req.params.id, userId: req.user._id });
  if (!semester) throw new ApiError(404, "Semester plan not found.", "SEMESTER_NOT_FOUND");
  const current = asArray(semester.collegeTimetable).find((item) => item.id === req.params.lectureId);
  if (!current) throw new ApiError(404, "Lecture not found.", "LECTURE_NOT_FOUND");
  const lecture = timetableEntry({ ...current.toObject?.() || current, ...req.body }, current.id);
  semester.collegeTimetable = asArray(semester.collegeTimetable).map((item) => item.id === current.id ? lecture : item);
  semester.markModified("collegeTimetable");
  await semester.save();
  await responseWithSemester(res, req.user._id, semester, "College Timetable updated.");
});

export const deleteTimetableLecture = asyncHandler(async (req, res) => {
  const semester = await Semester.findOne({ _id: req.params.id, userId: req.user._id });
  if (!semester) throw new ApiError(404, "Semester plan not found.", "SEMESTER_NOT_FOUND");
  const lecture = asArray(semester.collegeTimetable).find((item) => item.id === req.params.lectureId);
  if (!lecture) throw new ApiError(404, "Lecture not found.", "LECTURE_NOT_FOUND");
  semester.collegeTimetable = asArray(semester.collegeTimetable).filter((item) => item.id !== req.params.lectureId);
  semester.markModified("collegeTimetable");
  await semester.save();
  await responseWithSemester(res, req.user._id, semester, "College Timetable updated.");
});
