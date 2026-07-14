import Goal from "../models/Goal.js";
import Task from "../models/Task.js";
import { apiResponse } from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const startOfDay = (value = new Date()) => {
  const date = new Date(value);
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

export const getAnalytics = asyncHandler(async (req, res) => {
  const today = startOfDay();
  const eightWeeksAgo = addDays(today, -56);
  const nextThirtyDays = addDays(today, 30);

  const [taskAnalytics, goalAnalytics] = await Promise.all([
    Task.aggregate([
      { $match: { userId: req.user._id, ...plannerTaskFilter } },
      {
        $facet: {
          totals: [
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                completed: {
                  $sum: {
                    $cond: ["$completed", 1, 0],
                  },
                },
              },
            },
          ],
          weeklyProgress: [
            {
              $match: {
                date: { $gte: eightWeeksAgo, $lte: today },
              },
            },
            {
              $group: {
                _id: {
                  year: { $isoWeekYear: "$date" },
                  week: { $isoWeek: "$date" },
                },
                total: { $sum: 1 },
                completed: {
                  $sum: {
                    $cond: ["$completed", 1, 0],
                  },
                },
              },
            },
            { $sort: { "_id.year": 1, "_id.week": 1 } },
            {
              $project: {
                _id: 0,
                year: "$_id.year",
                week: "$_id.week",
                total: 1,
                completed: 1,
                completionRate: {
                  $cond: [
                    { $eq: ["$total", 0] },
                    0,
                    { $round: [{ $multiply: [{ $divide: ["$completed", "$total"] }, 100] }, 0] },
                  ],
                },
              },
            },
          ],
          deadlineHeatmap: [
            {
              $match: {
                type: { $in: ["deadline", "milestone"] },
                date: { $gte: today, $lte: nextThirtyDays },
              },
            },
            {
              $group: {
                _id: {
                  $dateToString: {
                    format: "%Y-%m-%d",
                    date: "$date",
                  },
                },
                count: { $sum: 1 },
                completed: {
                  $sum: {
                    $cond: ["$completed", 1, 0],
                  },
                },
              },
            },
            { $sort: { _id: 1 } },
            {
              $project: {
                _id: 0,
                date: "$_id",
                count: 1,
                completed: 1,
              },
            },
          ],
        },
      },
    ]),
    Goal.aggregate([
      { $match: { userId: req.user._id, status: { $ne: "archived" } } },
      {
        $group: {
          _id: null,
          averageProgress: { $avg: "$progress" },
          activeGoals: {
            $sum: {
              $cond: [{ $eq: ["$status", "active"] }, 1, 0],
            },
          },
          doneGoals: {
            $sum: {
              $cond: [{ $eq: ["$status", "done"] }, 1, 0],
            },
          },
        },
      },
    ]),
  ]);

  const analytics = taskAnalytics[0] || {};
  const totals = analytics.totals?.[0] || { total: 0, completed: 0 };
  const goals = goalAnalytics[0] || { averageProgress: 0, activeGoals: 0, doneGoals: 0 };
  const completionRate = totals.total ? Math.round((totals.completed / totals.total) * 100) : 0;
  const readinessScore = Math.round((completionRate * 0.55) + ((goals.averageProgress || 0) * 0.45));

  apiResponse(res, {
    completionRate,
    readinessScore,
    taskTotals: {
      total: totals.total,
      completed: totals.completed,
      open: totals.total - totals.completed,
    },
    goalTotals: {
      active: goals.activeGoals,
      done: goals.doneGoals,
      averageProgress: Math.round(goals.averageProgress || 0),
    },
    weeklyProgress: analytics.weeklyProgress || [],
    deadlineHeatmap: analytics.deadlineHeatmap || [],
  });
});
