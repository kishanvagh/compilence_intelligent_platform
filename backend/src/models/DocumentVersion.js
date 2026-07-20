import mongoose from "mongoose";

const documentVersionSchema = new mongoose.Schema(
  {
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Document",
      required: true,
    },
    versionNumber: {
      type: Number,
      required: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    extractedText: {
      type: String,
      default: "",
    },
    totalChunks: {
      type: Number,
      default: 0,
    },
    checksum: {
      type: String,
      default: "",
    },
    changeSummary: {
      type: String,
      default: "",
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

documentVersionSchema.index({ documentId: 1, versionNumber: -1 });
documentVersionSchema.index({ checksum: 1 });

export default mongoose.model("DocumentVersion", documentVersionSchema);