import mongoose from "mongoose";

const { Schema } = mongoose;

const aiHistorySchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      trim: true,
    },
    input: {
      type: String,
      default: "",
      trim: true,
    },
    output: {
      type: Schema.Types.Mixed,
      default: {},
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { versionKey: false }
);

aiHistorySchema.index({ userId: 1, createdAt: -1 });

const AIHistory = mongoose.model("AIHistory", aiHistorySchema);

export default AIHistory;
