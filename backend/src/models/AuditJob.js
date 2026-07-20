import mongoose from "mongoose";

const auditJobSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      default: null,
    },
    documentIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Document",
      },
    ],
    framework: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["queued", "processing", "completed", "failed", "cancelled"],
      default: "queued",
    },
    progress: {
      type: Number,
      default: 0,
    },
    totalControls: {
      type: Number,
      default: 0,
    },
    completedControls: {
      type: Number,
      default: 0,
    },
    failedControls: {
      type: Number,
      default: 0,
    },
    result: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    error: {
      type: String,
      default: null,
    },
    retryCount: {
      type: Number,
      default: 0,
    },
    maxRetries: {
      type: Number,
      default: 3,
    },
    priority: {
      type: Number,
      default: 0,
    },
    startedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

auditJobSchema.index({ userId: 1, status: 1 });
auditJobSchema.index({ workspaceId: 1, status: 1 });
auditJobSchema.index({ status: 1, priority: -1, createdAt: 1 });

export default mongoose.model("AuditJob", auditJobSchema);