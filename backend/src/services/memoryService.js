import AIHistory from "../models/AIHistory.js";
import BrainDump from "../models/BrainDump.js";
import Goal from "../models/Goal.js";
import Task from "../models/Task.js";
import Semester from "../models/Semester.js";

const compact = (value, max = 280) => String(value || "").replace(/\s+/g, " ").trim().slice(0, max);

export const getSecondBrainMemory = async (userId) => {
  const [brainDumps, goals, tasks, history, activeSemester] = await Promise.all([
    BrainDump.find({ userId }).select("title input extracted.subjects extracted.projects extracted.habits extracted.exams createdAt").sort({ createdAt: -1 }).limit(8).lean(),
    Goal.find({ userId, status: { $ne: "archived" } }).select("title description category priority progress dueDate status").sort({ dueDate: 1, _id: -1 }).limit(20).lean(),
    Task.find({ userId }).select("title category priority date estimatedTime recurring completed progress").sort({ date: -1, _id: -1 }).limit(30).lean(),
    AIHistory.find({ userId }).select("action input createdAt").sort({ createdAt: -1 }).limit(12).lean(),
    Semester.findOne({ userId, status: "active" }).select("name subjects assignments projects exams updatedAt").sort({ updatedAt: -1 }).lean(),
  ]);

  const subjects = [...new Set(brainDumps.flatMap((item) => item.extracted?.subjects || []).map((item) => compact(item.title || item.name, 80)).filter(Boolean))].slice(0, 16);
  const projects = [...new Set(brainDumps.flatMap((item) => item.extracted?.projects || []).map((item) => compact(item.title || item.name, 100)).filter(Boolean))].slice(0, 12);

  return {
    subjects,
    projects,
    recentBrainDumps: brainDumps.map((item) => ({ title: compact(item.title, 120), input: compact(item.input), createdAt: item.createdAt })),
    goals: goals.map((item) => ({ title: compact(item.title, 140), category: item.category, priority: item.priority, progress: item.progress, dueDate: item.dueDate, status: item.status })),
    plannerHistory: tasks.map((item) => ({ title: compact(item.title, 140), category: item.category, priority: item.priority, date: item.date, estimatedTime: item.estimatedTime, recurring: item.recurring, completed: item.completed, progress: item.progress })),
    recentConversations: history.map((item) => ({ action: item.action, input: compact(item.input), createdAt: item.createdAt })),
    currentSemester: activeSemester ? {
      name: activeSemester.name,
      subjects: activeSemester.subjects?.map((item) => item.name).filter(Boolean).slice(0, 12),
      upcomingExams: activeSemester.exams?.filter((item) => item.date && new Date(item.date) >= new Date()).slice(0, 8),
      assignments: activeSemester.assignments?.filter((item) => item.status !== "completed").slice(0, 10),
      projects: activeSemester.projects?.slice(0, 8),
    } : null,
  };
};
