import mongoose from "mongoose";

const { Schema } = mongoose;

const timetableLectureSchema = new Schema(
  {
    id: { type: String, required: true, trim: true },
    day: { type: String, required: true, enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] },
    startTime: { type: String, required: true, match: /^([01][0-9]|2[0-3]):[0-5][0-9]$/ },
    endTime: { type: String, required: true, match: /^([01][0-9]|2[0-3]):[0-5][0-9]$/ },
    subject: { type: String, required: true, trim: true, maxlength: 120 },
    room: { type: String, trim: true, maxlength: 120, default: "" },
    faculty: { type: String, trim: true, maxlength: 120, default: "" },
  },
  { _id: false },
);

const semesterSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 160 },
    inputHash: { type: String, required: true, index: true },
    status: { type: String, enum: ["active", "archived"], default: "active", index: true },
    manualEntry: { type: Schema.Types.Mixed, default: {} },
    uploads: [{ name: String, type: String, size: Number }],
    subjects: { type: [Schema.Types.Mixed], default: [] },
    assignments: { type: [Schema.Types.Mixed], default: [] },
    projects: { type: [Schema.Types.Mixed], default: [] },
    exams: { type: [Schema.Types.Mixed], default: [] },
    // Kept distinct from planner tasks: these are scheduled college lectures,
    // not work that the student needs to complete.
    collegeTimetable: { type: [timetableLectureSchema], default: [] },
    calendar: { type: [Schema.Types.Mixed], default: [] },
    studyPlan: { type: [Schema.Types.Mixed], default: [] },
    revisionPlan: { type: [Schema.Types.Mixed], default: [] },
    goals: { type: [Schema.Types.Mixed], default: [] },
    upcomingEvents: { type: [Schema.Types.Mixed], default: [] },
    knowledgeGraph: { type: Schema.Types.Mixed, default: { nodes: [], edges: [] } },
    generatedTaskIds: [{ type: Schema.Types.ObjectId, ref: "Task" }],
    generatedGoalIds: [{ type: Schema.Types.ObjectId, ref: "Goal" }],
    brainDumpId: { type: Schema.Types.ObjectId, ref: "BrainDump", default: null },
    canvasId: { type: Schema.Types.ObjectId, ref: "Canvas", default: null },
    ai: { type: Schema.Types.Mixed, default: {} },
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true, versionKey: false }
);

semesterSchema.index({ userId: 1, status: 1, updatedAt: -1 });
semesterSchema.index({ userId: 1, inputHash: 1 }, { unique: true });

export default mongoose.model("Semester", semesterSchema);
