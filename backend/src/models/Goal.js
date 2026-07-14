import mongoose from "mongoose";

const { Schema } = mongoose;

const goalSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
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
      default: "Personal",
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    dueDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["active", "done", "archived"],
      default: "active",
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

goalSchema.index({ userId: 1, status: 1, dueDate: 1 });
goalSchema.index({ userId: 1, _id: -1 });
goalSchema.index({ userId: 1, category: 1, priority: 1 });

const Goal = mongoose.model("Goal", goalSchema);

export default Goal;
