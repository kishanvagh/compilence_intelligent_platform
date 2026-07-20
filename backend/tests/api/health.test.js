import { describe, it, before } from "node:test";
import assert from "node:assert/strict";

// This test assumes the server is running on a test instance
// For now, we test the module imports and basic structure

describe("API Health", () => {
  it("should verify all enterprise service imports work", async () => {
    const services = [
      "../../src/services/core/cache.service.js",
      "../../src/services/core/logger.service.js",
      "../../src/services/core/jobQueue.service.js",
      "../../src/services/compliance/framework.service.js",
      "../../src/services/compliance/documentClassifier.service.js",
      "../../src/services/compliance/dashboard.service.js",
      "../../src/services/compliance/enterpriseCompliance.service.js",
    ];

    for (const service of services) {
      try {
        await import(service);
        assert.ok(true, `Successfully imported: ${service}`);
      } catch (error) {
        assert.fail(`Failed to import ${service}: ${error.message}`);
      }
    }
  });

  it("should verify all controller imports work", async () => {
    const controllers = [
      "../../src/controllers/workspaceController.js",
      "../../src/controllers/enterpriseController.js",
    ];

    for (const controller of controllers) {
      try {
        await import(controller);
        assert.ok(true, `Successfully imported: ${controller}`);
      } catch (error) {
        assert.fail(`Failed to import ${controller}: ${error.message}`);
      }
    }
  });

  it("should verify all route imports work", async () => {
    const routes = [
      "../../src/routes/workspaceRoutes.js",
      "../../src/routes/enterpriseRoutes.js",
    ];

    for (const route of routes) {
      try {
        await import(route);
        assert.ok(true, `Successfully imported: ${route}`);
      } catch (error) {
        assert.fail(`Failed to import ${route}: ${error.message}`);
      }
    }
  });

  it("should verify framework configs load correctly", async () => {
    const { nistControls } = await import("../../src/config/frameworks/nist.controls.js");
    const { pciControls } = await import("../../src/config/frameworks/pci.controls.js");
    const { getAvailableFrameworks } = await import("../../src/services/compliance/framework.service.js");

    assert.ok(nistControls.length > 0, "NIST controls should not be empty");
    assert.ok(pciControls.length > 0, "PCI controls should not be empty");

    const frameworks = getAvailableFrameworks();
    assert.ok(frameworks.length >= 5, "Should have at least 5 frameworks");
    assert.ok(frameworks.find((f) => f.frameworkId === "NIST"), "Should include NIST");
    assert.ok(frameworks.find((f) => f.frameworkId === "PCI"), "Should include PCI");
  });
});