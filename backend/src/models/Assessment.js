import mongoose from "mongoose";

const assessmentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Document",
      required: true,
    },

    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      default: null,
    },

    framework: {
      type: String,
      required: true,
    },

    documentType: {
      type: String,
      default: null,
    },

    assessmentStatus: {
      type: String,
      default: "APPLICABLE",
    },

    reason: {
      type: String,
      default: null,
    },

    riskScore: {
      type: Number,
      required: true,
    },

    complianceScore: {
      type: Number,
      default: 0,
    },

    compliantControls: {
      type: Number,
      default: 0,
    },

    partialControls: {
      type: Number,
      default: 0,
    },

    nonCompliantControls: {
      type: Number,
      default: 0,
    },

    notApplicableControls: {
      type: Number,
      default: 0,
    },

    totalControls: {
      type: Number,
      default: 0,
    },

    controls: {
      type: Array,
      default: [],
    },

    citations: {
      type: Array,
      default: [],
    },

    report: {
      type: Object,
      default: {},
    },

    recommendations: {
      type: Array,
      default: [],
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

assessmentSchema.index({ userId: 1, workspaceId: 1 });
assessmentSchema.index({ documentId: 1, framework: 1 });
assessmentSchema.index({ framework: 1, createdAt: -1 });

export default mongoose.model(
  "Assessment",
  assessmentSchema
);