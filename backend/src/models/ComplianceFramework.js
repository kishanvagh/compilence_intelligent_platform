import mongoose from "mongoose";

const controlSchema = new mongoose.Schema(
  {
    controlId: {
      type: String,
      required: true,
    },
    controlName: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    requiredEvidence: {
      type: [String],
      default: [],
    },
    riskLevel: {
      type: String,
      enum: ["CRITICAL", "HIGH", "MEDIUM", "LOW"],
      default: "MEDIUM",
    },
    mappedCategories: {
      type: [String],
      default: [],
    },
   审计Criteria: {
      type: String,
      default: "",
    },
    implementationGuidance: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

const frameworkSchema = new mongoose.Schema(
  {
    frameworkId: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    version: {
      type: String,
      default: "1.0",
    },
    description: {
      type: String,
      default: "",
    },
    category: {
      type: String,
      enum: ["security", "privacy", "data_protection", "risk_management", "custom"],
      default: "custom",
    },
    controls: {
      type: [controlSchema],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
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

// frameworkId is already unique via the schema field definition
// Remove duplicate index - uniqueness is enforced at field level
frameworkSchema.index({ category: 1, isActive: 1 });

export default mongoose.model("ComplianceFramework", frameworkSchema);