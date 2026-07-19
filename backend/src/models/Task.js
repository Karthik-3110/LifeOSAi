import mongoose from "mongoose";

const { Schema } = mongoose;

const taskSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    goalId: {
      type: Schema.Types.ObjectId,
      ref: "Goal",
      default: null,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["task", "deadline", "milestone"],
      default: "task",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
      index: true,
    },
    category: {
      type: String,
      trim: true,
      default: "General",
      index: true,
    },
    tag: {
      type: String,
      trim: true,
      default: "",
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    time: {
      type: String,
      default: "",
      trim: true,
    },
    estimatedTime: {
      type: Number,
      default: 45,
      min: 0,
      max: 1440,
    },
    recurring: {
      type: String,
      enum: ["none", "daily", "weekly", "monthly"],
      default: "none",
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    source: {
      type: String,
      enum: ["planner", "brain-dump", "semester-copilot"],
      default: "planner",
      index: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    versionKey: false,
  }
);

taskSchema.index({ userId: 1, date: 1 });
taskSchema.index({ userId: 1, completed: 1, date: 1 });
taskSchema.index({ userId: 1, source: 1, date: 1 });
taskSchema.index({ userId: 1, category: 1, priority: 1 });

const Task = mongoose.model("Task", taskSchema);

export default Task;
