import mongoose from "mongoose";

const workspaceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    members: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        role: {
          type: String,
          enum: ["owner", "admin", "editor", "viewer"],
          default: "viewer",
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
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
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

workspaceSchema.index({ userId: 1, name: 1 }, { unique: true });
workspaceSchema.index({ userId: 1, isActive: 1 });

export default mongoose.model("Workspace", workspaceSchema);