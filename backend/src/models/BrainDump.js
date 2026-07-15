import mongoose from "mongoose";

const { Schema } = mongoose;

const brainDumpSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    input: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      default: "Untitled Brain Dump",
    },
    extracted: {
      tasks: { type: [Schema.Types.Mixed], default: [] },
      goals: { type: [Schema.Types.Mixed], default: [] },
      notes: { type: [Schema.Types.Mixed], default: [] },
      relationships: { type: [Schema.Types.Mixed], default: [] },
      categories: { type: [String], default: [] },
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { versionKey: false }
);

brainDumpSchema.index({ userId: 1, createdAt: -1 });
brainDumpSchema.index({ userId: 1, createdAt: -1, _id: -1 });

const BrainDump = mongoose.model("BrainDump", brainDumpSchema);

export default BrainDump;
