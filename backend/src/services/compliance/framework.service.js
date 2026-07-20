import { soc2Controls } from "../../config/frameworks/soc2.controls.js";
import { iso27001Controls } from "../../config/frameworks/iso27001.controls.js";
import { gdprControls } from "../../config/frameworks/gdpr.controls.js";
import { nistControls } from "../../config/frameworks/nist.controls.js";
import { pciControls } from "../../config/frameworks/pci.controls.js";
import ComplianceFramework from "../../models/ComplianceFramework.js";

/**
 * Built-in framework control map for fast access
 */
const builtInFrameworks = {
  SOC2: soc2Controls,
  ISO27001: iso27001Controls,
  GDPR: gdprControls,
  NIST: nistControls,
  "NIST CSF": nistControls,
  PCI: pciControls,
  "PCI DSS": pciControls,
};

/**
 * Get controls for a framework from the database or built-in definitions.
 * Database-stored frameworks take precedence.
 */
export const getFrameworkControls = (framework) => {
  const key = framework?.toUpperCase();

  // Try built-in first (fast path)
  const builtIn = builtInFrameworks[key];
  if (builtIn) return builtIn;

  return soc2Controls; // Default fallback
};

/**
 * Seed a framework from built-in definitions into MongoDB
 */
export const seedFrameworkToDB = async (frameworkId) => {
  const key = frameworkId?.toUpperCase();
  const controls = builtInFrameworks[key];
  if (!controls) throw new Error(`Unknown framework: ${frameworkId}`);

  const existing = await ComplianceFramework.findOne({ frameworkId: key });
  if (existing) {
    existing.controls = controls;
    existing.isActive = true;
    return existing.save();
  }

  return ComplianceFramework.create({
    frameworkId: key,
    name: frameworkId,
    version: "1.0",
    description: `${frameworkId} compliance controls`,
    category: getFrameworkCategory(key),
    controls,
    isActive: true,
  });
};

const getFrameworkCategory = (frameworkId) => {
  const map = {
    SOC2: "security",
    ISO27001: "security",
    GDPR: "data_protection",
    NIST: "security",
    "NIST CSF": "security",
    PCI: "security",
    "PCI DSS": "security",
  };
  return map[frameworkId] || "custom";
};

/**
 * Get list of all available frameworks
 */
export const getAvailableFrameworks = () => {
  return Object.keys(builtInFrameworks).map((key) => ({
    frameworkId: key,
    name: key,
    controlCount: builtInFrameworks[key].length,
  }));
};

/**
 * Get framework metadata
 */
export const getFrameworkMetadata = (framework) => {
  const controls = getFrameworkControls(framework);
  const riskLevels = {};
  for (const c of controls) {
    const level = c.riskLevel || "MEDIUM";
    riskLevels[level] = (riskLevels[level] || 0) + 1;
  }

  return {
    framework,
    totalControls: controls.length,
    riskDistribution: riskLevels,
    categories: [...new Set(controls.flatMap((c) => c.mappedCategories || []))],
  };
};
