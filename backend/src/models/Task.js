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
    completed: {
      type: Boolean,
      default: false,
    },
    source: {
      type: String,
      enum: ["planner"],
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

const Task = mongoose.model("Task", taskSchema);

export default Task;
