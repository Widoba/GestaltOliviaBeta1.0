/**
 * Performance Optimization Service
 * Central service for managing all performance optimizations
 */
import { Message, AssistantType } from '../contexts/ChatContext';
import cacheService from './cacheService';
import optimizedDataService from './optimizedDataService';
import optimizedDataRetrievalService from './optimizedDataRetrievalService';
import promptOptimizationService from './promptOptimizationService';
import { RetrievedData } from './dataRetrievalService';
import { PromptOptimizationOptions } from './promptOptimizationService';

/**
 * Performance metrics for monitoring
 */
export interface PerformanceMetrics {
  tokenUsage: {
    totalTokens: number;
    promptTokens: number;
    completionTokens: number;
    savedTokens: number;
  };
  cacheMetrics: {
    hitRate: number;
    missRate: number;
    totalRequests: number;
    dataCacheSize: number;
    queryCacheSize: number;
  };
  responseTime: {
    averageResponseTime: number;
    lastResponseTime: number;
    p90ResponseTime: number;
  };
  optimizationStats: {
    promptOptimizationRate: number;
    dataBatchingRate: number;
    dataCompressionRate: number;
  };
  lastUpdated: Date;
}

/**
 * Options for performance optimization
 */
export interface PerformanceOptimizationOptions {
  enableCaching?: boolean;
  enableBatching?: boolean;
  enablePromptOptimization?: boolean;
  promptOptimizationOptions?: PromptOptimizationOptions;
  preloadCommonData?: boolean;
  maxConcurrentRequests?: number;
}

/**
 * Comprehensive Performance Optimization Service
 * Integrates caching, batching, and prompt optimization
 */
class PerformanceOptimizationService {
  // Track response times for performance monitoring
  private responseTimes: number[] = [];
  
  // Track token usage
  private tokenUsage = {
    totalTokens: 0,
    promptTokens: 0,
    completionTokens: 0,
    savedTokens: 0
  };
  
  // Default options
  private defaultOptions: PerformanceOptimizationOptions = {
    enableCaching: true,
    enableBatching: true,
    enablePromptOptimization: true,
    promptOptimizationOptions: {
      compressionLevel: 'medium',
      maxDataItems: 10,
      prioritizeRecent: true
    },
    preloadCommonData: true,
    maxConcurrentRequests: 5
  };
  
  // Track current performance options
  private currentOptions: PerformanceOptimizationOptions;
  
  // Track number of API requests
  private totalRequests = 0;
  
  constructor(options?: PerformanceOptimizationOptions) {
    this.currentOptions = { ...this.defaultOptions, ...options };
    
    // Preload common data if enabled
    if (this.currentOptions.preloadCommonData) {
      this.preloadCommonData();
    }
  }
  
  /**
   * Preload commonly accessed data into cache
   */
  private async preloadCommonData(): Promise<void> {
    try {
      console.info('Preloading common data into cache...');
      
      // Get all employees (used frequently)
      await optimizedDataService.getEmployees();
      
      // Get open jobs (used frequently)
      await optimizedDataService.getJobsByStatus('open');
      
      // Get active candidates (used frequently)
      await optimizedDataService.getCandidatesByStage('interview');
      
      console.info('Preloading complete.');
    } catch (error) {
      console.error('Error preloading common data:', error);
    }
  }
  
  /**
   * Optimize a system prompt with data inclusion
   * @param prompt Original system prompt
   * @param data Retrieved data
   * @param assistantType Current assistant type
   * @returns Optimized prompt
   */
  optimizePrompt(
    prompt: string,
    data?: RetrievedData,
    assistantType?: AssistantType
  ): string {
    // Skip optimization if disabled
    if (!this.currentOptions.enablePromptOptimization) {
      return prompt;
    }
    
    const startTime = Date.now();
    
    try {
      // Apply prompt optimization
      const { optimizedPrompt, metrics } = promptOptimizationService.optimizeSystemPrompt(
        prompt,
        data,
        this.currentOptions.promptOptimizationOptions
      );
      
      // Track token savings
      this.tokenUsage.savedTokens += metrics.tokenSavings;
      
      // Record performance metrics
      this.recordOptimizationMetrics(
        'promptOptimization',
        startTime,
        metrics.reductionPercentage / 100
      );
      
      return optimizedPrompt;
    } catch (error) {
      console.error('Error optimizing prompt:', error);
      
      // Return original prompt if optimization fails
      return prompt;
    }
  }
  
  /**
   * Retrieve data for a query with optimized performance
   * @param query User query
   * @returns Retrieved data
   */
  async retrieveDataForQuery(query: string): Promise<RetrievedData> {
    const startTime = Date.now();
    
    try {
      // Use optimized data retrieval service
      const data = await optimizedDataRetrievalService.retrieveDataForQuery(query);
      
      // Record performance metrics
      this.recordResponseTime(Date.now() - startTime);
      
      return data;
    } catch (error) {
      console.error('Error retrieving data for query:', error);
      this.recordResponseTime(Date.now() - startTime);
      return {};
    }
  }
  
  /**
   * Enhance a message with optimized performance
   * @param message User message
   * @param assistantType Current assistant type
   * @returns Optimized message
   */
  optimizeMessage(message: string, assistantType: AssistantType): string {
    // Skip optimization if disabled
    if (!this.currentOptions.enablePromptOptimization) {
      return message;
    }
    
    try {
      // Apply message optimization
      return promptOptimizationService.optimizeMessage(message, assistantType);
    } catch (error) {
      console.error('Error optimizing message:', error);
      return message;
    }
  }
  
  /**
   * Optimize message history for token efficiency
   * @param messages Message history
   * @returns Optimized message history
   */
  optimizeMessageHistory(messages: Message[]): Message[] {
    // Skip optimization if disabled
    if (!this.currentOptions.enablePromptOptimization) {
      return messages;
    }
    
    try {
      // Apply message optimization to each message
      return messages.map(msg => ({
        ...msg,
        content: this.optimizeMessage(msg.content, msg.assistantType || 'unified')
      }));
    } catch (error) {
      console.error('Error optimizing message history:', error);
      return messages;
    }
  }
  
  /**
   * Track performance metrics
   * @param apiResponse API response with token usage
   */
  trackApiUsage(apiResponse: any): void {
    if (!apiResponse || !apiResponse.usage) {
      return;
    }
    
    // Track token usage
    const { input_tokens, output_tokens } = apiResponse.usage;
    
    this.tokenUsage.promptTokens += input_tokens;
    this.tokenUsage.completionTokens += output_tokens;
    this.tokenUsage.totalTokens += input_tokens + output_tokens;
    
    // Increment request count
    this.totalRequests++;
  }
  
  /**
   * Get current performance metrics
   * @returns Performance metrics
   */
  getPerformanceMetrics(): PerformanceMetrics {
    // Get cache stats
    const cacheStats = cacheService.getStats();
    
    // Calculate cache metrics
    const totalCacheRequests = cacheStats.hits + cacheStats.misses;
    const hitRate = totalCacheRequests > 0 ? cacheStats.hits / totalCacheRequests : 0;
    const missRate = totalCacheRequests > 0 ? cacheStats.misses / totalCacheRequests : 0;
    
    // Calculate data cache size
    const dataCacheSize = [
      'employees', 'jobs', 'candidates', 'shifts', 'tasks', 'recognition'
    ].reduce((sum, category) => {
      return sum + (cacheStats.categories[category]?.size || 0);
    }, 0);
    
    // Get query cache size
    const queryCacheSize = cacheStats.categories['query']?.size || 0;
    
    // Calculate response time percentiles
    const sortedResponseTimes = [...this.responseTimes].sort((a, b) => a - b);
    const p90Index = Math.floor(sortedResponseTimes.length * 0.9);
    const p90ResponseTime = sortedResponseTimes.length > 0 ? 
      sortedResponseTimes[p90Index] : 0;
    
    // Get data retrieval metrics
    const dataMetrics = optimizedDataRetrievalService.getMetrics();
    
    return {
      tokenUsage: { ...this.tokenUsage },
      cacheMetrics: {
        hitRate,
        missRate,
        totalRequests: totalCacheRequests,
        dataCacheSize,
        queryCacheSize
      },
      responseTime: {
        averageResponseTime: this.calculateAverageResponseTime(),
        lastResponseTime: this.responseTimes.length > 0 ? 
          this.responseTimes[this.responseTimes.length - 1] : 0,
        p90ResponseTime
      },
      optimizationStats: {
        promptOptimizationRate: this.tokenUsage.savedTokens / 
          (this.tokenUsage.totalTokens + this.tokenUsage.savedTokens || 1),
        dataBatchingRate: optimizedDataService.getPerformanceMetrics().batchedRequests / 
          (optimizedDataService.getPerformanceMetrics().totalDataRequests || 1),
        dataCompressionRate: dataMetrics.cacheHits / 
          (dataMetrics.cacheHits + dataMetrics.cacheMisses || 1)
      },
      lastUpdated: new Date()
    };
  }
  
  /**
   * Update performance optimization options
   * @param options New options
   */
  updateOptions(options: Partial<PerformanceOptimizationOptions>): void {
    this.currentOptions = {
      ...this.currentOptions,
      ...options
    };
    
    // If preloading is enabled and wasn't before, preload data
    if (options.preloadCommonData && !this.currentOptions.preloadCommonData) {
      this.preloadCommonData();
    }
  }
  
  /**
   * Clear all caches
   */
  clearCaches(): void {
    cacheService.clear();
    optimizedDataRetrievalService.clearQueryCache();
    console.info('All caches cleared.');
  }
  
  /**
   * Record response time
   * @param time Response time in milliseconds
   */
  private recordResponseTime(time: number): void {
    // Keep last 100 response times
    this.responseTimes.push(time);
    if (this.responseTimes.length > 100) {
      this.responseTimes.shift();
    }
  }
  
  /**
   * Calculate average response time
   * @returns Average response time
   */
  private calculateAverageResponseTime(): number {
    if (this.responseTimes.length === 0) {
      return 0;
    }
    
    return this.responseTimes.reduce((sum, time) => sum + time, 0) / 
      this.responseTimes.length;
  }
  
  /**
   * Record optimization metrics
   * @param type Type of optimization
   * @param startTime Start time of operation
   * @param optimizationRate Optimization rate (0-1)
   */
  private recordOptimizationMetrics(
    type: string,
    startTime: number,
    optimizationRate: number
  ): void {
    // Record response time
    this.recordResponseTime(Date.now() - startTime);
    
    // Add additional metrics based on type
    switch (type) {
      case 'promptOptimization':
        // Additional prompt optimization metrics could be added here
        break;
      case 'dataBatching':
        // Additional data batching metrics could be added here
        break;
      case 'caching':
        // Additional caching metrics could be added here
        break;
    }
  }
}

// Export a singleton instance
const performanceOptimizationService = new PerformanceOptimizationService();
export default performanceOptimizationService;