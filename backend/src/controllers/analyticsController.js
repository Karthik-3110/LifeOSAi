import Goal from "../models/Goal.js";
import AIHistory from "../models/AIHistory.js";
import BrainDump from "../models/BrainDump.js";
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
    { source: { $in: ["planner", "brain-dump", "semester-copilot"] } },
    { source: { $exists: false }, tag: { $in: ["", "Task"] } },
  ],
};

export const getAnalytics = asyncHandler(async (req, res) => {
  const today = startOfDay();
  const eightWeeksAgo = addDays(today, -56);
  const nextThirtyDays = addDays(today, 30);

  const [taskAnalytics, goalAnalytics, brainDumpCount, aiUsage, categoryStats] = await Promise.all([
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
    BrainDump.countDocuments({ userId: req.user._id }),
    AIHistory.countDocuments({ userId: req.user._id }),
    Task.aggregate([
      { $match: { userId: req.user._id, ...plannerTaskFilter } },
      {
        $group: {
          _id: "$category",
          total: { $sum: 1 },
          completed: { $sum: { $cond: ["$completed", 1, 0] } },
          studyHours: { $sum: { $divide: [{ $ifNull: ["$estimatedTime", 45] }, 60] } },
        },
      },
      {
        $project: {
          _id: 0,
          category: { $ifNull: ["$_id", "General"] },
          total: 1,
          completed: 1,
          studyHours: { $round: ["$studyHours", 1] },
          completionRate: {
            $cond: [
              { $eq: ["$total", 0] },
              0,
              { $round: [{ $multiply: [{ $divide: ["$completed", "$total"] }, 100] }, 0] },
            ],
          },
        },
      },
      { $sort: { total: -1 } },
      { $limit: 8 },
    ]),
  ]);

  const analytics = taskAnalytics[0] || {};
  const totals = analytics.totals?.[0] || { total: 0, completed: 0 };
  const goals = goalAnalytics[0] || { averageProgress: 0, activeGoals: 0, doneGoals: 0 };
  const completionRate = totals.total ? Math.round((totals.completed / totals.total) * 100) : 0;
  const readinessScore = Math.round((completionRate * 0.55) + ((goals.averageProgress || 0) * 0.45));
  const studyHours = categoryStats.reduce((sum, item) => sum + (item.studyHours || 0), 0);
  const strongest = categoryStats.slice().sort((a, b) => b.completionRate - a.completionRate)[0];
  const weakest = categoryStats.filter((item) => item.total > 0).sort((a, b) => a.completionRate - b.completionRate)[0];
  const latestWeeklyProgress = analytics.weeklyProgress?.[analytics.weeklyProgress.length - 1];
  const suggestions = [
    strongest ? `You are strongest in ${strongest.category} with a ${strongest.completionRate}% completion rate.` : "Create tasks from a Brain Dump to unlock stronger study insights.",
    weakest ? `Give ${weakest.category} a focused review block; it has the most room to improve.` : "Add subjects to your planner so LifeOS can detect weak areas.",
    completionRate < 60 ? "Keep today's plan small: finish the top two tasks before adding more." : "Your completion trend is healthy. Protect your best study block today.",
    brainDumpCount ? "Brain Dumps are growing your knowledge graph. Revisit older canvases before exams." : "Start with one Brain Dump to generate your planner, graph, and study plan automatically.",
  ];

  apiResponse(res, {
    completionRate,
    readinessScore,
    productivityScore: readinessScore,
    dailyProductivity: completionRate,
    weeklyProductivity: latestWeeklyProgress?.completionRate || 0,
    monthlyProductivity: completionRate,
    studyHours,
    focusHours: Math.round(studyHours * 0.72 * 10) / 10,
    brainDumpsCreated: brainDumpCount,
    studyStreak: analytics.weeklyProgress?.filter((week) => week.completed > 0).length || 0,
    aiUsage,
    knowledgeGrowth: brainDumpCount + (goals.activeGoals || 0) + categoryStats.length,
    mostStudiedSubjects: categoryStats,
    strongAreas: strongest ? [strongest] : [],
    weakAreas: weakest ? [weakest] : [],
    suggestions,
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
