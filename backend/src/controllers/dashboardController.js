import Goal from "../models/Goal.js";
import Task from "../models/Task.js";
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
    { source: "planner" },
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
      .select("title description priority category progress dueDate status createdAt")
      .sort({ dueDate: 1, _id: -1 })
      .limit(6)
      .lean(),
    Task.find({
      userId: req.user._id,
      ...plannerTaskFilter,
      completed: false,
      date: { $gte: today, $lt: nextWeek },
    })
      .select("goalId title type tag date time completed source createdAt")
      .sort({ date: 1, _id: -1 })
      .limit(10)
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

  apiResponse(res, {
    stats: {
      totalGoals,
      activeGoals: goalsByStatus.active || 0,
      doneGoals: goalsByStatus.done || 0,
      archivedGoals: goalsByStatus.archived || 0,
      totalTasks,
      completedTasks,
      openTasks: tasksByCompletion.open || 0,
      completionRate: totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0,
    },
    recentGoals,
    upcomingTasks,
    upcomingGoals,
    upcoming,
  });
});
