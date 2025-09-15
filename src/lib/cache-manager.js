// Simple in-memory cache for domain lookups and pricing
class CacheManager {
  constructor() {
    this.lookupCache = new Map();
    this.priceCache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes cache
  }

  /**
   * Cache domain lookup result
   */
  cacheLookup(domain, result) {
    this.lookupCache.set(domain, {
      data: result,
      timestamp: Date.now()
    });
    console.log(`📦 Cached lookup for ${domain}`);
  }

  /**
   * Get cached domain lookup
   */
  getCachedLookup(domain) {
    const cached = this.lookupCache.get(domain);
    if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
      console.log(`⚡ Using cached lookup for ${domain}`);
      return cached.data;
    }
    return null;
  }

  /**
   * Cache domain price result
   */
  cachePrice(domain, result) {
    this.priceCache.set(domain, {
      data: result,
      timestamp: Date.now()
    });
    console.log(`📦 Cached price for ${domain}`);
  }

  /**
   * Get cached domain price
   */
  getCachedPrice(domain) {
    const cached = this.priceCache.get(domain);
    if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
      console.log(`⚡ Using cached price for ${domain}`);
      return cached.data;
    }
    return null;
  }

  /**
   * Clear expired cache entries
   */
  clearExpired() {
    const now = Date.now();
    
    for (const [key, value] of this.lookupCache.entries()) {
      if (now - value.timestamp >= this.cacheTimeout) {
        this.lookupCache.delete(key);
      }
    }
    
    for (const [key, value] of this.priceCache.entries()) {
      if (now - value.timestamp >= this.cacheTimeout) {
        this.priceCache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      lookupCacheSize: this.lookupCache.size,
      priceCacheSize: this.priceCache.size,
      cacheTimeoutMinutes: this.cacheTimeout / (60 * 1000)
    };
  }
}

module.exports = CacheManager;

