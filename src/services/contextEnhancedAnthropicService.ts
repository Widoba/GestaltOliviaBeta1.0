/**
 * Enhanced Anthropic Service with context window management
 */
import anthropicService, { 
  Message as ApiMessage, 
  AnthropicResponse, 
  AnthropicAPIOptions 
} from './anthropicService';
import historyService, { ContextMetadata } from './historyService';
import { Message, AssistantType } from '../contexts/ChatContext';

/**
 * Options for context-enhanced API calls
 */
export interface ContextEnhancedOptions extends AnthropicAPIOptions {
  activeAssistant: AssistantType;
  preserveHistory?: boolean;
  trackTokenUsage?: boolean;
}

/**
 * Response with added context information
 */
export interface ContextEnhancedResponse extends AnthropicResponse {
  contextMetadata?: ContextMetadata;
  truncatedMessageCount?: number;
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
    // Prepare messages for the API request
    const { messages: optimizedApiMessages, includedMessageCount } = 
      historyService.prepareMessagesForRequest(messages, options.activeAssistant);
    
    // Track message truncation
    const truncatedMessageCount = messages.length - includedMessageCount;
      
    try {
      // Call the base Anthropic service
      const response = await anthropicService.sendMessage(
        optimizedApiMessages,
        {
          system: options.system,
          temperature: options.temperature,
          maxTokens: options.maxTokens,
          retries: options.retries
        }
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
      
      // Return enhanced response
      return {
        ...response,
        contextMetadata,
        truncatedMessageCount: truncatedMessageCount > 0 ? truncatedMessageCount : undefined
      };
    } catch (error) {
      console.error('Error in context-enhanced API call:', error);
      throw error;
    }
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