const prisma = require("../prisma").payment;

class LoadingCache {
  constructor({
    maximumSize,
    expireAfterAccessMs,
    loader
  }) {
    this.maximumSize = maximumSize;
    this.expireAfterAccessMs = expireAfterAccessMs;
    this.loader = loader;

    /*
     * Map preserves insertion order.
     * The newest accessed entry is moved to the end.
     */
    this.entries = new Map();

    /*
     * Prevent multiple simultaneous database queries
     * for the same product.
     */
    this.pendingLoads = new Map();

    this.cacheStats = {
      hits: 0,
      misses: 0,
      loadSuccess: 0,
      loadFailure: 0,
      evictions: 0,
      expirations: 0
    };
  }

  async get(key) {
    const normalizedKey = String(key);
    const now = Date.now();

    const entry = this.entries.get(normalizedKey);

    if (entry) {
      if (entry.expiresAt > now) {
        this.cacheStats.hits++;

        /*
         * expireAfterAccess behavior:
         * extend expiration after every successful access.
         */
        entry.expiresAt =
          now + this.expireAfterAccessMs;

        /*
         * Move to the end of the Map so it becomes
         * the most recently used entry.
         */
        this.entries.delete(normalizedKey);
        this.entries.set(normalizedKey, entry);

        return entry.value;
      }

      this.entries.delete(normalizedKey);
      this.cacheStats.expirations++;
    }

    this.cacheStats.misses++;

    /*
     * If another request is already loading this product,
     * wait for the same Promise instead of querying again.
     */
    const existingLoad =
      this.pendingLoads.get(normalizedKey);

    if (existingLoad) {
      return existingLoad;
    }

    const loadPromise = this.load(normalizedKey);

    this.pendingLoads.set(
      normalizedKey,
      loadPromise
    );

    try {
      return await loadPromise;
    } finally {
      this.pendingLoads.delete(normalizedKey);
    }
  }

  async load(key) {
    try {
      const value = await this.loader(key);

      if (value === null || value === undefined) {
        throw new Error(
          `Cache loader returned no value for key: ${key}`
        );
      }

      this.cacheStats.loadSuccess++;
      this.put(key, value);

      return value;
    } catch (error) {
      this.cacheStats.loadFailure++;
      throw error;
    }
  }

  put(key, value) {
    const normalizedKey = String(key);

    /*
     * Remove the existing value first so this entry
     * becomes the most recently used entry.
     */
    this.entries.delete(normalizedKey);

    this.entries.set(normalizedKey, {
      value,
      expiresAt:
        Date.now() + this.expireAfterAccessMs
    });

    this.evictIfNeeded();

    return value;
  }

  invalidate(key) {
    const normalizedKey = String(key);

    this.entries.delete(normalizedKey);
    this.pendingLoads.delete(normalizedKey);
  }

  invalidateAll() {
    this.entries.clear();
    this.pendingLoads.clear();
  }

  evictIfNeeded() {
    while (this.entries.size > this.maximumSize) {
      const oldestKey =
        this.entries.keys().next().value;

      this.entries.delete(oldestKey);
      this.cacheStats.evictions++;
    }
  }

  size() {
    return this.entries.size;
  }

  stats() {
    const totalRequests =
      this.cacheStats.hits +
      this.cacheStats.misses;

    return {
      ...this.cacheStats,
      size: this.entries.size,
      pendingLoads: this.pendingLoads.size,
      hitRate:
        totalRequests === 0
          ? 0
          : this.cacheStats.hits / totalRequests
    };
  }
}

async function loadProductFromDatabase(productId) {
  const product = await prisma.product.findUnique({
    where: {
      id: String(productId)
    }
  });

  if (!product) {
    const error = new Error(
      `Product not found: ${productId}`
    );

    error.statusCode = 404;
    throw error;
  }

  return product;
}

const productCache = new LoadingCache({
  maximumSize: 100000,
  expireAfterAccessMs: 60 * 60 * 1000,
  loader: loadProductFromDatabase
});

module.exports = productCache;