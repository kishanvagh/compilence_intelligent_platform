/**
 * In-memory cache with TTL support.
 * For production, replace with Redis.
 */
class CacheService {
  constructor() {
    this._store = new Map();
    this._ttlTimers = new Map();
  }

  /**
   * Get a cached value
   */
  get(key) {
    const entry = this._store.get(key);
    if (!entry) return null;
    if (entry.expiry && Date.now() > entry.expiry) {
      this._store.delete(key);
      return null;
    }
    return entry.value;
  }

  /**
   * Set a cached value with optional TTL in seconds
   */
  set(key, value, ttlSeconds = 300) {
    const expiry = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
    this._store.set(key, { value, expiry });

    // Clear any existing TTL timer
    if (this._ttlTimers.has(key)) {
      clearTimeout(this._ttlTimers.get(key));
    }

    // Set auto-expiry
    if (ttlSeconds) {
      const timer = setTimeout(() => {
        this._store.delete(key);
        this._ttlTimers.delete(key);
      }, ttlSeconds * 1000);
      timer.unref();
      this._ttlTimers.set(key, timer);
    }

    return value;
  }

  /**
   * Delete a cached value
   */
  del(key) {
    this._store.delete(key);
    if (this._ttlTimers.has(key)) {
      clearTimeout(this._ttlTimers.get(key));
      this._ttlTimers.delete(key);
    }
  }

  /**
   * Clear all cached values
   */
  flush() {
    this._store.clear();
    for (const timer of this._ttlTimers.values()) {
      clearTimeout(timer);
    }
    this._ttlTimers.clear();
  }

  /**
   * Get or set cache value via factory function
   */
  async getOrSet(key, factory, ttlSeconds = 300) {
    const cached = this.get(key);
    if (cached !== null) return cached;

    const value = await factory();
    return this.set(key, value, ttlSeconds);
  }

  /**
   * Get cache stats
   */
  get stats() {
    return {
      size: this._store.size,
      keys: Array.from(this._store.keys()),
    };
  }
}

// Singleton instance
const cache = new CacheService();

export default cache;
export { CacheService };