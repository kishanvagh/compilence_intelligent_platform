import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { CacheService } from "../../src/services/core/cache.service.js";

describe("CacheService", () => {
  let cache;

  beforeEach(() => {
    cache = new CacheService();
  });

  it("should store and retrieve values", () => {
    cache.set("key1", "value1");
    assert.equal(cache.get("key1"), "value1");
  });

  it("should return null for missing keys", () => {
    assert.equal(cache.get("nonexistent"), null);
  });

  it("should respect TTL", async () => {
    cache.set("temp", "value", 1); // 1 second TTL
    assert.equal(cache.get("temp"), "value");
    await new Promise((resolve) => setTimeout(resolve, 1100));
    assert.equal(cache.get("temp"), null);
  });

  it("should delete values", () => {
    cache.set("key", "value");
    cache.del("key");
    assert.equal(cache.get("key"), null);
  });

  it("should flush all values", () => {
    cache.set("a", 1);
    cache.set("b", 2);
    cache.flush();
    assert.equal(cache.get("a"), null);
    assert.equal(cache.get("b"), null);
  });

  it("should get or set via factory", async () => {
    let callCount = 0;
    const factory = async () => {
      callCount++;
      return "computed";
    };

    const result1 = await cache.getOrSet("factory", factory);
    const result2 = await cache.getOrSet("factory", factory);

    assert.equal(result1, "computed");
    assert.equal(result2, "computed");
    assert.equal(callCount, 1); // Factory called only once
  });

  it("should report stats", () => {
    cache.set("x", 1);
    cache.set("y", 2);
    const stats = cache.stats;
    assert.equal(stats.size, 2);
    assert.ok(stats.keys.includes("x"));
    assert.ok(stats.keys.includes("y"));
  });
});