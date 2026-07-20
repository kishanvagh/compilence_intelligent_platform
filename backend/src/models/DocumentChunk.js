import mongoose from "mongoose";

const documentChunkSchema = new mongoose.Schema(
  {
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Document",
      required: true,
    },

    chunkIndex: {
      type: Number,
      required: true,
    },

    text: {
      type: String,
      required: true,
    },

    isEmbedded: {
      type: Boolean,
      default: false,
    },
    pageNumber: {
      type: Number,
      default: 1,
    },
    qdrantPointId: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

documentChunkSchema.index({ documentId: 1, chunkIndex: 1 });
documentChunkSchema.index({ qdrantPointId: 1 });

export default mongoose.model(
  "DocumentChunk",
  documentChunkSchema
);