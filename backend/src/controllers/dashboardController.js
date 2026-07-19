import Goal from "../models/Goal.js";
import BrainDump from "../models/BrainDump.js";
import Task from "../models/Task.js";
import Semester from "../models/Semester.js";
import AIHistory from "../models/AIHistory.js";
import { getSecondBrainMemory } from "../services/memoryService.js";
import { generateDailyBrief } from "../services/openaiService.js";
import { apiResponse } from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

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

const plannerTaskFilter = {
  $or: [
    { source: { $in: ["planner", "brain-dump", "semester-copilot"] } },
    { source: { $exists: false }, tag: { $in: ["", "Task"] } },
  ],
};

export const getDashboard = asyncHandler(async (req, res) => {
  const today = startOfToday();
  const nextWeek = addDays(today, 7);

  const [
    goalStats,
    taskStats,
    recentGoals,
    upcomingTasks,
    upcomingGoals,
    brainDumpCount,
    todaysTasks,
    activeSemester,
  ] = await Promise.all([
    Goal.aggregate([
      { $match: { userId: req.user._id } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          averageProgress: { $avg: "$progress" },
        },
      },
    ]),
    Task.aggregate([
      { $match: { userId: req.user._id, ...plannerTaskFilter } },
      {
        $group: {
          _id: "$completed",
          count: { $sum: 1 },
        },
      },
    ]),
    Goal.find({ userId: req.user._id, status: { $ne: "archived" } })
      .select("title priority category progress dueDate status createdAt")
      .sort({ dueDate: 1, _id: -1 })
      .limit(6)
      .lean(),
    Task.find({
      userId: req.user._id,
      ...plannerTaskFilter,
      completed: false,
      date: { $gte: today, $lt: nextWeek },
    })
      .select("goalId title type priority category tag date time estimatedTime recurring progress completed source createdAt")
      .sort({ date: 1, _id: -1 })
      .limit(10)
      .lean(),
    Semester.findOne({ userId: req.user._id, status: "active" })
      .select("name subjects assignments projects exams")
      .sort({ updatedAt: -1 })
      .lean(),
    Goal.find({
      userId: req.user._id,
      status: { $ne: "done" },
      dueDate: { $gte: today },
    })
      .select("title dueDate priority category status")
      .sort({ dueDate: 1, _id: -1 })
      .limit(10)
      .lean(),
    BrainDump.countDocuments({ userId: req.user._id }),
    Task.find({
      userId: req.user._id,
      ...plannerTaskFilter,
      completed: false,
      date: { $gte: today, $lt: addDays(today, 1) },
    })
      .select("title priority category estimatedTime date")
      .sort({ priority: -1, date: 1, _id: -1 })
      .limit(6)
      .lean(),
  ]);

  const goalsByStatus = goalStats.reduce((acc, item) => {
    acc[item._id] = item.count;
    return acc;
  }, {});

  const tasksByCompletion = taskStats.reduce((acc, item) => {
    acc[item._id ? "completed" : "open"] = item.count;
    return acc;
  }, {});

  const totalGoals = goalStats.reduce((sum, item) => sum + item.count, 0);
  const totalTasks = taskStats.reduce((sum, item) => sum + item.count, 0);
  const completedTasks = tasksByCompletion.completed || 0;

  const upcoming = [
    ...upcomingTasks.map((task) => ({
      ...task,
      itemType: "task",
      sortDate: task.date,
    })),
    ...upcomingGoals.map((goal) => ({
      ...goal,
      itemType: "goal",
      date: goal.dueDate,
      sortDate: goal.dueDate,
    })),
  ]
    .sort((a, b) => new Date(a.sortDate) - new Date(b.sortDate))
    .slice(0, 12)
    .map(({ sortDate, ...item }) => item);

  const estimatedWorkload = todaysTasks.reduce((sum, task) => sum + (task.estimatedTime || 45), 0);
  const completionRate = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const soonestDeadline = upcoming.find((item) => item.type === "deadline" || item.itemType === "goal");
  const topFocus = todaysTasks[0]?.category || recentGoals[0]?.category || "your highest priority subject";

  const fallbackBrief = {
    priorities: todaysTasks.map((task) => task.title).slice(0, 4),
    estimatedWorkloadMinutes: estimatedWorkload,
    upcomingDeadlines: upcoming.slice(0, 4),
    studyRecommendation: `Focus on ${topFocus} today${soonestDeadline ? ` because "${soonestDeadline.title}" is coming up.` : "."}`,
    productivityScore: Math.min(100, Math.round((completionRate * 0.7) + ((goalsByStatus.done || 0) * 6) + Math.min(brainDumpCount, 10))),
  };

  let dailyBrief = fallbackBrief;
  try {
    const memory = await getSecondBrainMemory(req.user._id);
    const generatedBrief = await generateDailyBrief({
      memory,
      todaySummary: {
        priorities: fallbackBrief.priorities,
        upcomingDeadlines: fallbackBrief.upcomingDeadlines.map((item) => ({ title: item.title, date: item.date || item.dueDate })),
        estimatedWorkloadMinutes: estimatedWorkload,
        productivityScore: fallbackBrief.productivityScore,
      },
    });
    dailyBrief = {
      ...fallbackBrief,
      greeting: generatedBrief.greeting || "",
      studyRecommendation: generatedBrief.studyRecommendation || fallbackBrief.studyRecommendation,
      suggestions: Array.isArray(generatedBrief.suggestions) ? generatedBrief.suggestions.slice(0, 3) : [],
      productivityNote: generatedBrief.productivityNote || "",
    };
    await AIHistory.create({
      userId: req.user._id,
      action: "daily-brief",
      input: "Generate daily brief",
      output: dailyBrief,
    });
  } catch (error) {
    // The deterministic brief keeps the dashboard usable if the AI provider is temporarily unavailable.
  }

  apiResponse(res, {
    stats: {
      totalGoals,
      activeGoals: goalsByStatus.active || 0,
      doneGoals: goalsByStatus.done || 0,
      archivedGoals: goalsByStatus.archived || 0,
      totalTasks,
      completedTasks,
      openTasks: tasksByCompletion.open || 0,
      completionRate,
      brainDumpsCreated: brainDumpCount,
      productivityScore: Math.min(100, Math.round((completionRate * 0.7) + ((goalsByStatus.done || 0) * 6) + Math.min(brainDumpCount, 10))),
      estimatedWorkload,
    },
    dailyBrief,
    recentGoals,
    upcomingTasks,
    upcomingGoals,
    upcoming,
    semester: activeSemester ? {
      _id: activeSemester._id,
      name: activeSemester.name,
      subjectCount: activeSemester.subjects?.length || 0,
      upcomingExamCount: activeSemester.exams?.filter((item) => item.date && new Date(item.date) >= today).length || 0,
      assignmentCount: activeSemester.assignments?.length || 0,
      completion: (() => {
        const items = [...(activeSemester.assignments || []), ...(activeSemester.projects || [])];
        return items.length ? Math.round(items.reduce((sum, item) => sum + (Number(item.progress) || 0), 0) / items.length) : 0;
      })(),
    } : null,
  });
});
