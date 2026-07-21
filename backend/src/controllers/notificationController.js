import Notification from "../models/Notification.js";
import Semester from "../models/Semester.js";
import Task from "../models/Task.js";
import { createNotification } from "../services/notificationService.js";
import { apiResponse } from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const startOfToday = () => { const date = new Date(); date.setHours(0, 0, 0, 0); return date; };
const dateKey = (date) => new Date(date).toISOString().slice(0, 10);

const syncReminders = async (user) => {
  const today = startOfToday();
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
  const semesters = await Semester.find({ userId: user._id, status: "active" }).select("name assignments projects exams").lean();
  const tasks = await Task.find({ userId: user._id, completed: false, date: { $gte: today, $lt: tomorrow } }).select("_id title date").lean();
  const jobs = [];

  for (const semester of Array.isArray(semesters) ? semesters : []) {
    for (const exam of Array.isArray(semester.exams) ? semester.exams : []) {
      const examDate = exam?.date && new Date(exam.date);
      if (examDate && examDate >= tomorrow && examDate < new Date(tomorrow.getTime() + 86400000)) {
        jobs.push(createNotification({ userId: user._id, type: "exam", title: "Exam tomorrow", message: `${exam.title} is tomorrow. Plan a focused revision block today.`, resourceType: "semester", resourceId: String(semester._id), dedupeKey: `exam:${semester._id}:${exam.id}:${dateKey(examDate)}` }));
      }
    }
    for (const [kind, items] of [["assignment", semester.assignments], ["project", semester.projects]]) {
      for (const item of Array.isArray(items) ? items : []) {
        const dueDate = item?.date && new Date(item.date);
        if (dueDate && dueDate >= today && dueDate < new Date(tomorrow.getTime() + 86400000) && item.status !== "completed") {
          jobs.push(createNotification({ userId: user._id, type: kind, title: `${kind === "project" ? "Project" : "Assignment"} due today`, message: `${item.title} needs attention today.`, resourceType: "semester", resourceId: String(semester._id), dedupeKey: `${kind}:${semester._id}:${item.id}:${dateKey(dueDate)}` }));
        }
      }
    }
  }
  for (const task of Array.isArray(tasks) ? tasks : []) jobs.push(createNotification({ userId: user._id, type: "planner", title: "Planner reminder", message: task.title, resourceType: "task", resourceId: String(task._id), dedupeKey: `planner:${task._id}:${dateKey(today)}` }));
  if ((user.brainDumpCredits ?? 0) <= 1) jobs.push(createNotification({ userId: user._id, type: "credits", title: "Brain Dump credits running low", message: "You have one or no Brain Dump credits remaining.", resourceType: "billing", dedupeKey: `credits:${dateKey(today)}` }));
  await Promise.all(jobs);
};

export const listNotifications = asyncHandler(async (req, res) => {
  await syncReminders(req.user);
  const items = await Notification.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(50).lean();
  apiResponse(res, { items: Array.isArray(items) ? items : [], unreadCount: (Array.isArray(items) ? items : []).filter((item) => !item.read).length });
});

export const markNotificationRead = asyncHandler(async (req, res) => {
  const item = await Notification.findOneAndUpdate({ _id: req.params.id, userId: req.user._id }, { read: true }, { new: true }).lean();
  apiResponse(res, item || { read: true, _id: req.params.id });
});

export const markAllNotificationsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ userId: req.user._id, read: false }, { read: true });
  apiResponse(res, { updated: true });
});

export const clearNotifications = asyncHandler(async (req, res) => {
  await Notification.deleteMany({ userId: req.user._id });
  apiResponse(res, { cleared: true });
});
