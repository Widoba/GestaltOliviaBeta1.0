/**
 * Enhanced Anthropic Service with context window management
 */
import anthropicService, { 
  Message as ApiMessage, 
  AnthropicResponse, 
  AnthropicAPIOptions,
  Tool,
  ToolCall
} from './anthropicService';
import historyService, { ContextMetadata } from './historyService';
import { Message, AssistantType } from '../contexts/ChatContext';
import functionCallingService from './functionCallingService';

/**
 * Options for context-enhanced API calls
 */
export interface ContextEnhancedOptions extends AnthropicAPIOptions {
  activeAssistant: AssistantType;
  preserveHistory?: boolean;
  trackTokenUsage?: boolean;
  enableFunctionCalling?: boolean;
}

/**
 * Response with added context information
 */
export interface ContextEnhancedResponse extends AnthropicResponse {
  contextMetadata?: ContextMetadata;
  truncatedMessageCount?: number;
  structuredData?: any;
}

/**
 * Context-Enhanced Anthropic Service
 * Adds context window management capabilities to the base Anthropic service
 */
class ContextEnhancedAnthropicService {
  /**
   * Convert ChatContext messages to API messages
   * @param messages ChatContext messages
   * @returns API-compatible messages
   */
  private convertToApiMessages(messages: Message[]): ApiMessage[] {
    return messages
      .filter(msg => msg.role !== 'system') // System messages aren't sent to API
      .map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      }));
  }
  
  /**
   * Send a message with enhanced context management
   * @param messages Full message history
   * @param options Options for the API call
   * @returns Enhanced response with context metadata
   */
  async sendMessage(
    messages: Message[],
    options: ContextEnhancedOptions
  ): Promise<ContextEnhancedResponse> {
    // Import error handling utilities
    const { 
      parseAnthropicError, 
      AnthropicErrorCode,
      ErrorSeverity,
      ErrorCategory
    } = (await import('../utils/errorHandling')).default;
    
    // Prepare messages for the API request
    const { messages: optimizedApiMessages, includedMessageCount } = 
      historyService.prepareMessagesForRequest(messages, options.activeAssistant);
    
    // Track message truncation
    const truncatedMessageCount = messages.length - includedMessageCount;
    
    // Set up API options
    const apiOptions: AnthropicAPIOptions = {
      system: options.system,
      temperature: options.temperature,
      maxTokens: options.maxTokens,
      retries: options.retries
    };
    
    // Add tools if function calling is enabled
    if (options.enableFunctionCalling) {
      apiOptions.tools = functionCallingService.getAvailableTools();
    }
      
    try {
      // Call the base Anthropic service
      const response = await anthropicService.sendMessage(
        optimizedApiMessages,
        apiOptions
      );
      
      // Calculate context metadata if requested
      let contextMetadata: ContextMetadata | undefined;
      
      if (options.trackTokenUsage) {
        contextMetadata = {
          totalTokens: response.usage.input_tokens + response.usage.output_tokens,
          messageCount: includedMessageCount,
          lastUpdated: new Date()
        };
      }
      
      // Preserve history if requested
      if (options.preserveHistory) {
        // Get current state
        const currentState = historyService.loadConversationState() || {
          messages: [],
          activeAssistant: options.activeAssistant
        };
        
        // Update state with latest information
        historyService.saveConversationState({
          ...currentState,
          activeAssistant: options.activeAssistant,
          // Messages are managed elsewhere, so we don't update them here
        });
      }
      
      // Handle tool calls if present
      let structuredData: any = undefined;
      
      if (response.tool_calls && response.tool_calls.length > 0) {
        try {
          const toolResults = await functionCallingService.executeToolCalls(response.tool_calls);
          structuredData = this.processToolResults(toolResults);
        } catch (toolError) {
          console.error('Error executing tool calls:', toolError);
          
          // Even if tool calls fail, we can still return the main response
          // We just add an error to the structured data
          structuredData = {
            error: true,
            message: 'Failed to retrieve additional information',
            partialResults: true
          };
        }
      }
      
      // Return enhanced response
      return {
        ...response,
        contextMetadata,
        truncatedMessageCount: truncatedMessageCount > 0 ? truncatedMessageCount : undefined,
        structuredData
      };
    } catch (error) {
      console.error('Error in context-enhanced API call:', error);
      
      // Parse the error into a structured AnthropicError
      const parsedError = parseAnthropicError(error);
      
      // Log the structured error
      parsedError.logError();
      
      // If the error is retryable and we have retries left, we could implement retry logic here
      // But for now, we'll just propagate the error upward with improved context
      
      // For certain error types, we can provide a fallback response instead of failing completely
      if (parsedError.code === AnthropicErrorCode.CONTEXT_TOO_LONG) {
        // For context length errors, we can try again with a summary of the conversation
        // This would be implemented in a production system
        console.warn('Context too long, would attempt summarization in production');
      }
      
      if (parsedError.code === AnthropicErrorCode.RATE_LIMIT) {
        // For rate limit errors, we could delay and retry
        console.warn(`Rate limited, would wait ${parsedError.retryAfter || 5} seconds in production`);
      }
      
      // Rethrow the structured error for the caller to handle
      throw parsedError;
    }
  }
  
  /**
   * Process tool results into structured data for UI display
   * @param toolResults Results from tool execution
   * @returns Structured data for UI components
   */
  private processToolResults(toolResults: any[]): any {
    // Extract and format data from tool results for card display
    const structuredData: any = {};
    
    for (const result of toolResults) {
      const { tool_call_id, result: toolResult } = result;
      
      // Process based on result content
      if (toolResult.employee) {
        structuredData.employee = {
          ...toolResult.employee,
          dataType: 'employee'
        };
      } else if (toolResult.employees) {
        structuredData.employees = toolResult.employees.map((emp: any) => ({
          ...emp,
          dataType: 'employee'
        }));
      } else if (toolResult.tasks) {
        structuredData.tasks = toolResult.tasks.map((task: any) => ({
          ...task,
          dataType: 'task'
        }));
      } else if (toolResult.shifts) {
        structuredData.shifts = toolResult.shifts.map((shift: any) => ({
          ...shift,
          dataType: 'shift'
        }));
      } else if (toolResult.job) {
        structuredData.job = {
          ...toolResult.job,
          dataType: 'job'
        };
      } else if (toolResult.jobs) {
        structuredData.jobs = toolResult.jobs.map((job: any) => ({
          ...job,
          dataType: 'job'
        }));
      } else if (toolResult.candidate) {
        structuredData.candidate = {
          ...toolResult.candidate,
          dataType: 'candidate'
        };
      } else if (toolResult.candidates) {
        structuredData.candidates = toolResult.candidates.map((candidate: any) => ({
          ...candidate,
          dataType: 'candidate'
        }));
      } else if (toolResult.recognitions) {
        structuredData.recognitions = toolResult.recognitions.map((recognition: any) => ({
          ...recognition,
          dataType: 'recognition'
        }));
      } else if (toolResult.success) {
        // Action results (complete task, approve shift swap, etc.)
        structuredData.actionResult = {
          ...toolResult,
          dataType: 'actionResult'
        };
      }
    }
    
    return structuredData;
  }
  
  /**
   * Analyze token usage to determine if optimization is needed
   * @param messages Messages to analyze
   * @returns Analysis result
   */
  analyzeTokenUsage(messages: Message[]): {
    totalTokenEstimate: number;
    isNearingLimit: boolean;
    recommendedAction: 'none' | 'optimize' | 'summarize';
  } {
    // Estimate total tokens
    const totalTokenEstimate = historyService.calculateTotalTokens(messages);
    
    // Calculate percentage of budget used
    const maxTokens = 100000; // Claude 3.7 Sonnet context window
    const percentUsed = (totalTokenEstimate / maxTokens) * 100;
    
    // Determine recommended action
    let recommendedAction: 'none' | 'optimize' | 'summarize' = 'none';
    
    if (percentUsed > 80) {
      recommendedAction = 'summarize';
    } else if (percentUsed > 60) {
      recommendedAction = 'optimize';
    }
    
    return {
      totalTokenEstimate,
      isNearingLimit: percentUsed > 60,
      recommendedAction
    };
  }
  
  /**
   * Get a system message explaining token usage
   * @param analysis Token usage analysis
   * @returns System message about token usage
   */
  getTokenUsageMessage(analysis: ReturnType<typeof this.analyzeTokenUsage>): Message {
    const { totalTokenEstimate, percentUsed } = {
      ...analysis,
      percentUsed: (analysis.totalTokenEstimate / 100000) * 100
    };
    
    let content = '';
    
    if (analysis.recommendedAction === 'summarize') {
      content = `The conversation is getting long (approximately ${totalTokenEstimate.toLocaleString()} tokens, ${percentUsed.toFixed(1)}% of capacity). Some older messages have been summarized to maintain context while staying within limits.`;
    } else if (analysis.recommendedAction === 'optimize') {
      content = `The conversation is approaching context limits (approximately ${totalTokenEstimate.toLocaleString()} tokens, ${percentUsed.toFixed(1)}% of capacity). Some older messages may be optimized in future responses if needed.`;
    }
    
    if (!content) return {
      id: `token_${Date.now()}`,
      role: 'system',
      content: '',
      timestamp: new Date()
    };
    
    return {
      id: `token_${Date.now()}`,
      role: 'system',
      content,
      timestamp: new Date()
    };
  }
}

// Export a singleton instance
const contextEnhancedAnthropicService = new ContextEnhancedAnthropicService();
export default contextEnhancedAnthropicService;