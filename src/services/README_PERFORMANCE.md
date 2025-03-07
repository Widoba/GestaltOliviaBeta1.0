# Performance Optimization

This documentation describes the implementation of the Performance Optimization component for the Unified Assistant Prototype. This component focuses on improving application performance by implementing advanced caching, batched data fetching, and prompt optimization techniques.

## Overview

The Performance Optimization component consists of several services working together to improve performance:

1. **Cache Service**: Provides sophisticated caching capabilities with metrics, expiration, and categorization.
2. **Optimized Data Service**: Enhances data access with caching and request batching.
3. **Optimized Data Retrieval Service**: Optimizes data retrieval for queries with parallelization.
4. **Prompt Optimization Service**: Reduces token usage by optimizing prompts and data formatting.
5. **Performance Optimization Service**: Central service integrating all performance optimizations.

## Key Features

### Advanced Caching System

- **Category-based caching**: Data is cached by category (employees, jobs, candidates, etc.)
- **LRU (Least Recently Used) eviction**: Intelligently removes least accessed items when cache is full
- **TTL (Time-to-Live) expirations**: Different cache TTLs based on data volatility
- **Size-based limits**: Category and total size limits to prevent memory issues
- **Cache maintenance**: Automatic maintenance cycle for removing expired entries
- **Cache metrics**: Detailed statistics on hits, misses, sizes, etc.

### Batched Data Fetching

- **Request batching**: Combines similar data requests within a time window
- **Deduplicated requests**: Prevents redundant database/API calls
- **Parallel data loading**: Fetches different data types in parallel for faster responses
- **Preloading common data**: Preloads frequently accessed data on initialization

### Prompt Size Optimization

- **Prompt structure optimization**: Removes redundancy and verbosity from prompts
- **Data filtering**: Selectively includes only the most relevant data
- **Compression levels**: Configurable compression levels (low, medium, high)
- **Type-specific formatting**: Different optimization strategies for each data type
- **Token savings tracking**: Tracks and reports token usage savings

## Components

### Cache Service (`cacheService.ts`)

Provides a sophisticated caching mechanism with:

- Category-based caching
- Size estimation
- Expiration policies
- Eviction strategies
- Performance metrics

```typescript
// Example usage
import cacheService from './cacheService';

// Store in cache
cacheService.set('employee_123', employeeData, { 
  category: 'employees',
  ttl: 10 * 60 * 1000 // 10 minutes
});

// Retrieve from cache
const employee = cacheService.get('employee_123', 'employees');

// Clear category
cacheService.clearCategory('employees');

// Get cache stats
const stats = cacheService.getStats();
```

### Optimized Data Service (`optimizedDataService.ts`)

Enhances data access with:

- Cached access to entity data
- Request batching for similar data requests
- Metrics for performance monitoring
- Parallel data fetching

```typescript
// Example usage
import optimizedDataService from './optimizedDataService';

// Get employee with batching and caching
const employee = await optimizedDataService.getEmployeeById('123');

// Get multiple employees in one database call
const employees = await optimizedDataService.getEmployees();

// Get performance metrics
const metrics = optimizedDataService.getPerformanceMetrics();
```

### Optimized Data Retrieval Service (`optimizedDataRetrievalService.ts`)

Optimizes data retrieval for queries:

- Query-based data retrieval with caching
- Parallel entity processing
- Relationship resolution
- Query hash-based caching

```typescript
// Example usage
import optimizedDataRetrievalService from './optimizedDataRetrievalService';

// Get data for a query with caching
const data = await optimizedDataRetrievalService.retrieveDataForQuery(
  "Tell me about employee Sam's shifts and tasks"
);

// Get metrics
const metrics = optimizedDataRetrievalService.getMetrics();
```

### Prompt Optimization Service (`promptOptimizationService.ts`)

Reduces token usage by:

- Optimizing prompt structure
- Filtering and prioritizing data
- Compressing data representation
- Formatting data efficiently

```typescript
// Example usage
import promptOptimizationService from './promptOptimizationService';

// Optimize a system prompt with data
const { optimizedPrompt, metrics } = promptOptimizationService.optimizeSystemPrompt(
  originalPrompt,
  data,
  { compressionLevel: 'medium' }
);

// Optimize a message
const optimizedMessage = promptOptimizationService.optimizeMessage(
  message,
  'employee'
);
```

### Performance Optimization Service (`performanceOptimizationService.ts`)

Central service that:

- Integrates all optimization techniques
- Provides configuration options
- Tracks performance metrics
- Preloads common data

```typescript
// Example usage
import performanceOptimizationService from './performanceOptimizationService';

// Retrieve data with optimizations
const data = await performanceOptimizationService.retrieveDataForQuery(query);

// Optimize prompt
const optimizedPrompt = performanceOptimizationService.optimizePrompt(
  prompt,
  data
);

// Track API usage
performanceOptimizationService.trackApiUsage(apiResponse);

// Get performance metrics
const metrics = performanceOptimizationService.getPerformanceMetrics();
```

## Configuration Options

The Performance Optimization Service supports several configuration options:

```typescript
// Default options
{
  enableCaching: true,            // Enable/disable caching
  enableBatching: true,           // Enable/disable request batching
  enablePromptOptimization: true, // Enable/disable prompt optimization
  promptOptimizationOptions: {    // Prompt optimization options
    compressionLevel: 'medium',   // 'low', 'medium', or 'high'
    maxDataItems: 10,             // Maximum items per data type
    prioritizeRecent: true        // Prioritize recent data
  },
  preloadCommonData: true,        // Preload common data on initialization
  maxConcurrentRequests: 5        // Maximum concurrent requests
}
```

You can update these options at runtime:

```typescript
performanceOptimizationService.updateOptions({
  enablePromptOptimization: false,
  maxConcurrentRequests: 10
});
```

## Performance Metrics

The Performance Optimization Service provides detailed metrics:

```typescript
// Example metrics object
{
  tokenUsage: {
    totalTokens: 50000,          // Total tokens used
    promptTokens: 30000,         // Tokens used in prompts
    completionTokens: 20000,     // Tokens used in completions
    savedTokens: 10000           // Tokens saved by optimization
  },
  cacheMetrics: {
    hitRate: 0.75,               // Cache hit rate (0-1)
    missRate: 0.25,              // Cache miss rate (0-1)
    totalRequests: 100,          // Total cache requests
    dataCacheSize: 500000,       // Data cache size in bytes
    queryCacheSize: 100000       // Query cache size in bytes
  },
  responseTime: {
    averageResponseTime: 120,    // Average response time in ms
    lastResponseTime: 80,        // Last response time in ms
    p90ResponseTime: 200         // 90th percentile response time in ms
  },
  optimizationStats: {
    promptOptimizationRate: 0.2, // Percentage of tokens saved by prompt optimization
    dataBatchingRate: 0.3,       // Percentage of requests batched
    dataCompressionRate: 0.4     // Percentage of data compressed
  },
  lastUpdated: "2025-03-09T12:34:56.789Z" // Last updated timestamp
}
```

## Best Practices

1. **Enable all optimizations by default**: The default configuration should work well for most use cases.

2. **Monitor performance metrics**: Regularly check metrics to identify bottlenecks.

3. **Adjust compression level based on needs**:
   - Use 'low' when accuracy is critical
   - Use 'medium' for balanced performance
   - Use 'high' for maximum token savings

4. **Preload common data**: Enable data preloading for frequently accessed data.

5. **Clear cache selectively**: Use `clearCategory()` instead of `clear()` to preserve other cached data.

6. **Set appropriate TTLs**: Use shorter TTLs for volatile data and longer TTLs for stable data.

## Example Integration

Here's how to integrate the Performance Optimization Service with the Chat Context:

```typescript
import { useEffect, useCallback } from 'react';
import { useChatContext } from '../contexts/ChatContext';
import performanceOptimizationService from '../services/performanceOptimizationService';

function ChatContainer() {
  const { 
    messages, 
    sendMessage, 
    activeAssistant 
  } = useChatContext();

  // Optimize message before sending
  const sendOptimizedMessage = useCallback(async (content) => {
    // Retrieve optimized data
    const data = await performanceOptimizationService.retrieveDataForQuery(content);
    
    // Send message with optimized prompt
    sendMessage(content, data);
  }, [sendMessage]);

  // Track performance metrics
  useEffect(() => {
    const interval = setInterval(() => {
      const metrics = performanceOptimizationService.getPerformanceMetrics();
      console.log('Performance metrics:', metrics);
    }, 60000); // Log metrics every minute
    
    return () => clearInterval(interval);
  }, []);

  return (
    // ...component implementation
  );
}
```

## Conclusion

The Performance Optimization component significantly improves the efficiency and responsiveness of the Unified Assistant Prototype by reducing:

1. **Token usage**: Through prompt optimization and data filtering
2. **API calls**: Through strategic caching and request batching
3. **Response times**: Through parallel data fetching and preloading
4. **Resource usage**: Through efficient data management and eviction policies

These optimizations result in a more responsive user experience, lower API costs, and better overall performance.