import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    firebaseUid: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    name: {
      type: String,
      trim: true,
      default: "",
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    phoneNumber: {
      type: String,
      trim: true,
      default: "",
    },
    avatarUrl: {
      type: String,
      default: "",
    },
    brainDumpCredits: {
      type: Number,
      default: 5,
      min: 0,
    },
    unlimitedBrainDumpsUntil: {
      type: Date,
      default: null,
    },
    billingPlan: {
      type: String,
      default: "free",
      trim: true,
    },
    workspace: {
      type: String,
      default: "Personal",
      trim: true,
    },
    settings: {
      notifications: {
        type: Boolean,
        default: true,
      },
      weeklyDigest: {
        type: Boolean,
        default: true,
      },
      defaultCanvasView: {
        type: String,
        default: "fit",
        trim: true,
      },
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

const User = mongoose.model("User", userSchema);

export default User;
