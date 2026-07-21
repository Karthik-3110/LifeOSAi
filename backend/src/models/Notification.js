import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, default: "reminder", trim: true, maxlength: 60 },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    message: { type: String, default: "", trim: true, maxlength: 500 },
    read: { type: Boolean, default: false, index: true },
    resourceType: { type: String, default: "", trim: true, maxlength: 60 },
    resourceId: { type: String, default: "", trim: true, maxlength: 100 },
    dedupeKey: { type: String, default: "", trim: true },
  },
  { timestamps: true, versionKey: false },
);

notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, dedupeKey: 1 }, { unique: true, partialFilterExpression: { dedupeKey: { $type: "string", $gt: "" } } });

export default mongoose.model("Notification", notificationSchema);
