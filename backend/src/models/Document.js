import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
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

    originalName: {
      type: String,
      required: true,
    },

    filePath: {
      type: String,
      required: true,
    },

    fileSize: {
      type: Number,
      default: 0,
    },

    mimeType: {
      type: String,
      default: "application/pdf",
    },

    extractedText: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: ["uploaded", "processing", "completed", "failed"],
      default: "uploaded",
    },

    totalChunks: {
      type: Number,
      default: 0,
    },

    documentType: {
      type: String,
      enum: ["POLICY", "PROCEDURE", "STANDARD", "GUIDELINE", "CONTRACT", "VENDOR_DOCUMENT", "AUDIT_REPORT", "CERTIFICATE", "RESUME", "UNKNOWN"],
      default: "UNKNOWN",
    },

    classificationConfidence: {
      type: Number,
      default: 0,
    },

    tags: [
      {
        type: String,
        trim: true,
      },
    ],

    department: {
      type: String,
      default: "",
    },

    currentVersion: {
      type: Number,
      default: 1,
    },

    checksum: {
      type: String,
      default: "",
    },

    pageCount: {
      type: Number,
      default: 0,
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

documentSchema.index({ userId: 1, workspaceId: 1 });
documentSchema.index({ workspaceId: 1, status: 1 });
documentSchema.index({ documentType: 1 });
documentSchema.index({ tags: 1 });

export default mongoose.model("Document", documentSchema);
