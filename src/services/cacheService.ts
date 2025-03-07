/**
 * Advanced caching service for optimizing data access
 */

// Cache entry with expiration and metadata
interface CacheEntry<T> {
  data: T;
  expiry: number;
  lastAccessed: number;
  accessCount: number;
  size: number;
  category: string;
  key: string;
}

// Cache statistics for monitoring and optimization
interface CacheStats {
  hits: number;
  misses: number;
  totalEntries: number;
  totalSize: number;
  oldestEntry: number;
  newestEntry: number;
  evictions: number;
  categories: Record<string, {
    count: number;
    size: number;
    hits: number;
    misses: number;
  }>;
}

/**
 * Options for cache management
 */
interface CacheOptions {
  maxSize?: number;          // Maximum cache size in bytes (approximate)
  defaultTTL?: number;       // Default Time-To-Live in milliseconds
  sizeLimitPerCategory?: Record<string, number>; // Size limits per category
  estimateSizeFn?: (value: any) => number; // Function to estimate entry size
}

/**
 * Advanced caching service with LRU (Least Recently Used) policy,
 * category-based management, and performance monitoring
 */
class CacheService {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    totalEntries: 0,
    totalSize: 0,
    oldestEntry: Date.now(),
    newestEntry: Date.now(),
    evictions: 0,
    categories: {}
  };
  
  private options: Required<CacheOptions> = {
    maxSize: 100 * 1024 * 1024, // 100MB default
    defaultTTL: 5 * 60 * 1000,  // 5 minutes default
    sizeLimitPerCategory: {},
    estimateSizeFn: this.estimateSize
  };
  
  constructor(options?: CacheOptions) {
    if (options) {
      this.options = { ...this.options, ...options };
    }
    
    // Start cache maintenance cycle
    this.startMaintenanceCycle();
  }
  
  /**
   * Get a value from cache
   * @param key Cache key
   * @param category Data category (optional)
   * @returns Cached value or undefined if not found or expired
   */
  get<T>(key: string, category: string = 'default'): T | undefined {
    const cacheKey = this.generateCacheKey(key, category);
    const entry = this.cache.get(cacheKey);
    
    // Initialize category stats if needed
    this.ensureCategoryStats(category);
    
    // Not in cache
    if (!entry) {
      this.stats.misses++;
      this.stats.categories[category].misses++;
      return undefined;
    }
    
    const now = Date.now();
    
    // Check if expired
    if (entry.expiry < now) {
      this.remove(key, category);
      this.stats.misses++;
      this.stats.categories[category].misses++;
      return undefined;
    }
    
    // Update access stats
    entry.lastAccessed = now;
    entry.accessCount++;
    
    // Update global and category hits
    this.stats.hits++;
    this.stats.categories[category].hits++;
    
    return entry.data;
  }
  
  /**
   * Set a value in the cache
   * @param key Cache key
   * @param value Value to cache
   * @param options Cache options for this entry
   * @returns Success status
   */
  set<T>(
    key: string, 
    value: T, 
    options?: { 
      ttl?: number;
      category?: string;
      priority?: number; // 0-10, higher means less likely to be evicted
    }
  ): boolean {
    const now = Date.now();
    const category = options?.category || 'default';
    const ttl = options?.ttl || this.options.defaultTTL;
    
    // Initialize category stats if needed
    this.ensureCategoryStats(category);
    
    // Remove old entry if it exists
    this.remove(key, category);
    
    // Calculate entry size
    const size = this.options.estimateSizeFn(value);
    
    // Check category size limit
    const categoryLimit = this.options.sizeLimitPerCategory[category];
    if (categoryLimit && this.stats.categories[category].size + size > categoryLimit) {
      // Need to evict entries from this category
      this.evictFromCategory(category, size);
    }
    
    // Check overall cache size limit
    if (this.stats.totalSize + size > this.options.maxSize) {
      // Need to evict entries from the cache
      this.evictEntries(size);
    }
    
    const cacheKey = this.generateCacheKey(key, category);
    
    // Create new entry
    const entry: CacheEntry<T> = {
      data: value,
      expiry: now + ttl,
      lastAccessed: now,
      accessCount: 0,
      size,
      category,
      key
    };
    
    // Add to cache
    this.cache.set(cacheKey, entry);
    
    // Update stats
    this.stats.totalEntries = this.cache.size;
    this.stats.totalSize += size;
    this.stats.newestEntry = now;
    this.stats.categories[category].count++;
    this.stats.categories[category].size += size;
    
    return true;
  }
  
  /**
   * Remove an item from the cache
   * @param key Cache key
   * @param category Data category (optional)
   * @returns True if removed, false if not found
   */
  remove(key: string, category: string = 'default'): boolean {
    const cacheKey = this.generateCacheKey(key, category);
    const entry = this.cache.get(cacheKey);
    
    if (!entry) {
      return false;
    }
    
    // Update stats
    this.stats.totalSize -= entry.size;
    this.stats.totalEntries = this.cache.size - 1;
    this.stats.categories[entry.category].count--;
    this.stats.categories[entry.category].size -= entry.size;
    
    // Remove from cache
    return this.cache.delete(cacheKey);
  }
  
  /**
   * Remove all entries in a category
   * @param category Category to clear
   * @returns Number of entries removed
   */
  clearCategory(category: string): number {
    let removed = 0;
    
    // Find all entries in this category
    for (const [key, entry] of this.cache.entries()) {
      if (entry.category === category) {
        this.stats.totalSize -= entry.size;
        this.cache.delete(key);
        removed++;
      }
    }
    
    // Reset category stats
    if (this.stats.categories[category]) {
      this.stats.categories[category] = {
        count: 0,
        size: 0,
        hits: this.stats.categories[category].hits,
        misses: this.stats.categories[category].misses
      };
    }
    
    // Update total stats
    this.stats.totalEntries = this.cache.size;
    
    return removed;
  }
  
  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    
    // Reset categories sizes
    for (const category in this.stats.categories) {
      this.stats.categories[category].count = 0;
      this.stats.categories[category].size = 0;
    }
    
    // Reset stats but keep hit/miss counts for analysis
    this.stats.totalEntries = 0;
    this.stats.totalSize = 0;
    this.stats.oldestEntry = Date.now();
    this.stats.newestEntry = Date.now();
  }
  
  /**
   * Check if a key exists in the cache and is not expired
   * @param key Cache key
   * @param category Data category (optional)
   * @returns True if exists and valid, false otherwise
   */
  has(key: string, category: string = 'default'): boolean {
    const cacheKey = this.generateCacheKey(key, category);
    const entry = this.cache.get(cacheKey);
    
    if (!entry) {
      return false;
    }
    
    // Check if expired
    return entry.expiry >= Date.now();
  }
  
  /**
   * Get all keys in a category
   * @param category Category to get keys for
   * @returns Array of keys
   */
  getKeys(category?: string): string[] {
    const keys: string[] = [];
    
    for (const entry of this.cache.values()) {
      if (!category || entry.category === category) {
        keys.push(entry.key);
      }
    }
    
    return keys;
  }
  
  /**
   * Get cache statistics
   * @returns Current cache statistics
   */
  getStats(): CacheStats {
    // Calculate hit rates
    const enhancedStats = { ...this.stats };
    const categories = { ...enhancedStats.categories };
    
    for (const category in categories) {
      const cat = categories[category];
      const totalAccesses = cat.hits + cat.misses;
      categories[category] = {
        ...cat,
        hitRate: totalAccesses ? cat.hits / totalAccesses : 0
      };
    }
    
    const totalAccesses = enhancedStats.hits + enhancedStats.misses;
    
    return {
      ...enhancedStats,
      categories,
      hitRate: totalAccesses ? enhancedStats.hits / totalAccesses : 0,
      averageEntrySize: enhancedStats.totalEntries ? 
        enhancedStats.totalSize / enhancedStats.totalEntries : 0,
      utilizationRate: enhancedStats.totalSize / this.options.maxSize
    };
  }
  
  /**
   * Run cache maintenance to remove expired entries
   */
  private runMaintenance(): void {
    const now = Date.now();
    let expiredCount = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiry < now) {
        // Update category stats
        this.stats.categories[entry.category].count--;
        this.stats.categories[entry.category].size -= entry.size;
        
        // Update total stats
        this.stats.totalSize -= entry.size;
        
        // Remove expired entry
        this.cache.delete(key);
        expiredCount++;
      }
    }
    
    // Update entry count after removals
    this.stats.totalEntries = this.cache.size;
    
    if (expiredCount > 0) {
      console.info(`Cache maintenance: removed ${expiredCount} expired entries`);
    }
  }
  
  /**
   * Start the maintenance cycle for removing expired entries
   */
  private startMaintenanceCycle(): void {
    // Run maintenance every minute
    setInterval(() => this.runMaintenance(), 60 * 1000);
  }
  
  /**
   * Evict entries from a specific category to free up space
   * @param category Category to evict from
   * @param sizeNeeded Amount of space needed
   */
  private evictFromCategory(category: string, sizeNeeded: number): void {
    // Find all entries in this category
    const categoryEntries: CacheEntry<any>[] = [];
    
    for (const entry of this.cache.values()) {
      if (entry.category === category) {
        categoryEntries.push(entry);
      }
    }
    
    // Sort by last accessed (oldest first)
    categoryEntries.sort((a, b) => a.lastAccessed - b.lastAccessed);
    
    // Evict entries until we have enough space
    let freedSpace = 0;
    let evicted = 0;
    
    for (const entry of categoryEntries) {
      if (freedSpace >= sizeNeeded) {
        break;
      }
      
      const cacheKey = this.generateCacheKey(entry.key, entry.category);
      
      // Remove from cache
      this.cache.delete(cacheKey);
      
      // Update stats
      freedSpace += entry.size;
      this.stats.totalSize -= entry.size;
      this.stats.categories[category].count--;
      this.stats.categories[category].size -= entry.size;
      this.stats.evictions++;
      evicted++;
    }
    
    // Update total entries
    this.stats.totalEntries = this.cache.size;
    
    if (evicted > 0) {
      console.info(`Cache eviction: removed ${evicted} entries from category ${category} to free ${freedSpace} bytes`);
    }
  }
  
  /**
   * Evict entries from the cache to free up space
   * @param sizeNeeded Amount of space needed
   */
  private evictEntries(sizeNeeded: number): void {
    // Get all entries
    const allEntries: CacheEntry<any>[] = Array.from(this.cache.values());
    
    // Sort by last accessed (oldest first)
    allEntries.sort((a, b) => a.lastAccessed - b.lastAccessed);
    
    // Evict entries until we have enough space
    let freedSpace = 0;
    let evicted = 0;
    
    for (const entry of allEntries) {
      if (freedSpace >= sizeNeeded) {
        break;
      }
      
      const cacheKey = this.generateCacheKey(entry.key, entry.category);
      
      // Remove from cache
      this.cache.delete(cacheKey);
      
      // Update stats
      freedSpace += entry.size;
      this.stats.totalSize -= entry.size;
      this.stats.categories[entry.category].count--;
      this.stats.categories[entry.category].size -= entry.size;
      this.stats.evictions++;
      evicted++;
    }
    
    // Update total entries
    this.stats.totalEntries = this.cache.size;
    
    if (evicted > 0) {
      console.info(`Cache eviction: removed ${evicted} entries to free ${freedSpace} bytes`);
    }
  }
  
  /**
   * Generate a unique cache key
   * @param key User-provided key
   * @param category Data category
   * @returns Unique cache key
   */
  private generateCacheKey(key: string, category: string): string {
    return `${category}:${key}`;
  }
  
  /**
   * Ensure category stats exist
   * @param category Category to check
   */
  private ensureCategoryStats(category: string): void {
    if (!this.stats.categories[category]) {
      this.stats.categories[category] = {
        count: 0,
        size: 0,
        hits: 0,
        misses: 0
      };
    }
  }
  
  /**
   * Estimate the size of a value in bytes (approximate)
   * @param value Value to estimate size of
   * @returns Approximate size in bytes
   */
  private estimateSize(value: any): number {
    if (value === null || value === undefined) {
      return 8;
    }
    
    const type = typeof value;
    
    switch (type) {
      case 'boolean':
        return 4;
      case 'number':
        return 8;
      case 'string':
        return value.length * 2 + 8; // UTF-16 + overhead
      case 'object':
        if (Array.isArray(value)) {
          // For arrays, estimate each element recursively
          return value.reduce((size, item) => size + this.estimateSize(item), 16);
        } else {
          // For objects, estimate properties recursively
          let size = 32; // Object overhead
          for (const key in value) {
            size += key.length * 2 + 8; // Key size + pointer
            size += this.estimateSize(value[key]); // Value size
          }
          return size;
        }
      default:
        return 16; // Default estimate for other types
    }
  }
}

// Export singleton instance
const cacheService = new CacheService({
  maxSize: 200 * 1024 * 1024, // 200MB max cache size
  defaultTTL: 10 * 60 * 1000, // 10 minutes default TTL
  sizeLimitPerCategory: {
    'employees': 40 * 1024 * 1024,   // 40MB for employees
    'candidates': 30 * 1024 * 1024,  // 30MB for candidates
    'jobs': 20 * 1024 * 1024,        // 20MB for jobs
    'shifts': 20 * 1024 * 1024,      // 20MB for shifts
    'tasks': 20 * 1024 * 1024,       // 20MB for tasks
    'recognition': 10 * 1024 * 1024, // 10MB for recognition
    'query': 50 * 1024 * 1024,       // 50MB for query results
    'relationships': 10 * 1024 * 1024 // 10MB for relationship data
  }
});

export default cacheService;