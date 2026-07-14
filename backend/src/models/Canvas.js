import mongoose from "mongoose";

const { Schema } = mongoose;

const pointSchema = new Schema(
  {
    x: Number,
    y: Number,
  },
  { _id: false }
);

const nodeSchema = new Schema(
  {
    id: String,
    type: String,
    label: String,
    position: pointSchema,
    data: Schema.Types.Mixed,
  },
  { _id: false }
);

const edgeSchema = new Schema(
  {
    id: String,
    source: String,
    target: String,
    sourceHandle: String,
    targetHandle: String,
    type: String,
    label: String,
    animated: Boolean,
    data: Schema.Types.Mixed,
    style: Schema.Types.Mixed,
    markerEnd: Schema.Types.Mixed,
  },
  { _id: false }
);

const canvasSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    brainDumpId: {
      type: Schema.Types.ObjectId,
      ref: "BrainDump",
      required: true,
      index: true,
    },
    nodes: {
      type: [nodeSchema],
      default: [],
    },
    edges: {
      type: [edgeSchema],
      default: [],
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    versionKey: false,
  }
);

canvasSchema.index({ userId: 1, brainDumpId: 1 }, { unique: true });

canvasSchema.pre("save", function setUpdatedAt() {
  this.updatedAt = new Date();
});

const Canvas = mongoose.model("Canvas", canvasSchema);

let canvasIndexRepairPromise = null;

export const ensureCanvasIndexes = () => {
  if (!canvasIndexRepairPromise) {
    canvasIndexRepairPromise = (async () => {
      const indexes = await Canvas.collection.indexes();
      const legacyUniqueUserIndex = indexes.find((index) => index.name === "userId_1" && index.unique);

      if (legacyUniqueUserIndex) {
        await Canvas.collection.dropIndex(legacyUniqueUserIndex.name);
        await Canvas.collection.createIndex({ userId: 1 }, { name: "userId_1", background: true });
      }

      await Canvas.collection.createIndex(
        { userId: 1, brainDumpId: 1 },
        { name: "userId_1_brainDumpId_1", unique: true, background: true }
      );
    })().catch((error) => {
      canvasIndexRepairPromise = null;
      throw error;
    });
  }

  return canvasIndexRepairPromise;
};

export default Canvas;
