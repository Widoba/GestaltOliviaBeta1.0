/**
 * Service for managing conversation history and context window
 */
import { Message, AssistantType } from '../contexts/ChatContext';

// Constants for context window management
const MAX_CONTEXT_WINDOW_TOKENS = 100000; // Claude 3.7 Sonnet context window
const APPROXIMATE_TOKENS_PER_CHAR = 0.25; // Rough estimation
const TOKEN_BUFFER = 10000; // Buffer to ensure we stay under limit
const EFFECTIVE_TOKEN_LIMIT = MAX_CONTEXT_WINDOW_TOKENS - TOKEN_BUFFER;

// Token budgets for different components (approximated)
const SYSTEM_PROMPT_TOKEN_BUDGET = 4000;
const DATA_CONTEXT_TOKEN_BUDGET = 5000;
const HISTORY_TOKEN_BUDGET = EFFECTIVE_TOKEN_LIMIT - SYSTEM_PROMPT_TOKEN_BUDGET - DATA_CONTEXT_TOKEN_BUDGET;

/**
 * Interface for conversation state
 */
export interface ConversationState {
  messages: Message[];
  activeAssistant: AssistantType;
  preferences?: Record<string, any>;
  referencedData?: Record<string, any>;
}

/**
 * Interface for context metadata
 */
export interface ContextMetadata {
  totalTokens: number;
  messageCount: number;
  lastUpdated: Date;
}

/**
 * History Service for managing conversation history and context window
 */
class HistoryService {
  private localStorage: Storage | null = null;
  
  constructor() {
    // Check if localStorage is available (will be null in SSR)
    if (typeof window !== 'undefined') {
      this.localStorage = window.localStorage;
    }
  }
  
  /**
   * Roughly estimate the number of tokens in a text
   * @param text Text to estimate tokens for
   * @returns Estimated token count
   */
  estimateTokenCount(text: string): number {
    if (!text) return 0;
    return Math.ceil(text.length * APPROXIMATE_TOKENS_PER_CHAR);
  }
  
  /**
   * Calculate token usage for a message
   * @param message Message to calculate tokens for
   * @returns Token count
   */
  calculateMessageTokens(message: Message): number {
    // Role typically is 1-2 tokens
    const roleTokens = 2;
    
    // Content tokens
    const contentTokens = this.estimateTokenCount(message.content);
    
    // Metadata is small but still counts
    const metadataTokens = 5;
    
    return roleTokens + contentTokens + metadataTokens;
  }
  
  /**
   * Save the current conversation state
   * @param state Current conversation state
   */
  saveConversationState(state: ConversationState): void {
    if (!this.localStorage) return;
    
    try {
      this.localStorage.setItem('conversationState', JSON.stringify({
        messages: state.messages,
        activeAssistant: state.activeAssistant,
        preferences: state.preferences || {},
        referencedData: state.referencedData || {},
        metadata: {
          totalTokens: this.calculateTotalTokens(state.messages),
          messageCount: state.messages.length,
          lastUpdated: new Date()
        }
      }));
    } catch (error) {
      console.error('Error saving conversation state:', error);
    }
  }
  
  /**
   * Load the saved conversation state
   * @returns Saved conversation state or null if not available
   */
  loadConversationState(): ConversationState | null {
    if (!this.localStorage) return null;
    
    try {
      const savedState = this.localStorage.getItem('conversationState');
      if (!savedState) return null;
      
      const parsedState = JSON.parse(savedState);
      
      // Convert date strings back to Date objects
      parsedState.messages.forEach((msg: Message) => {
        msg.timestamp = new Date(msg.timestamp);
      });
      
      return {
        messages: parsedState.messages,
        activeAssistant: parsedState.activeAssistant,
        preferences: parsedState.preferences,
        referencedData: parsedState.referencedData
      };
    } catch (error) {
      console.error('Error loading conversation state:', error);
      return null;
    }
  }
  
  /**
   * Clear the saved conversation state
   */
  clearConversationState(): void {
    if (!this.localStorage) return;
    this.localStorage.removeItem('conversationState');
  }
  
  /**
   * Calculate total tokens for a message array
   * @param messages Messages to calculate tokens for
   * @returns Total token count
   */
  calculateTotalTokens(messages: Message[]): number {
    return messages.reduce((total, message) => {
      return total + this.calculateMessageTokens(message);
    }, 0);
  }
  
  /**
   * Optimize messages to fit within token budget
   * @param messages Full message history
   * @param keepSystemMessages Whether to keep system messages
   * @returns Optimized message array
   */
  optimizeMessageHistory(messages: Message[], keepSystemMessages: boolean = true): Message[] {
    if (messages.length === 0) return [];
    
    // Calculate current token usage
    const currentTokens = this.calculateTotalTokens(messages);
    
    // If we're under budget, return all messages
    if (currentTokens <= HISTORY_TOKEN_BUDGET) {
      return [...messages];
    }
    
    // We need to optimize
    const optimizedMessages: Message[] = [];
    let tokenBudget = HISTORY_TOKEN_BUDGET;
    
    // Always keep the most recent messages (last 4 message pairs)
    const recentMessageCount = Math.min(8, messages.length);
    const recentMessages = messages.slice(-recentMessageCount);
    
    // Calculate tokens for recent messages
    const recentTokens = this.calculateTotalTokens(recentMessages);
    tokenBudget -= recentTokens;
    
    // Mark recent messages for keeping
    recentMessages.forEach(msg => optimizedMessages.push(msg));
    
    // Consider remaining messages (oldest to newest, excluding already kept messages)
    const remainingMessages = messages.slice(0, -recentMessageCount);
    
    // First, consider system messages if we want to keep them
    if (keepSystemMessages) {
      const systemMessages = remainingMessages.filter(msg => msg.role === 'system');
      let systemTokens = 0;
      
      for (const msg of systemMessages) {
        const msgTokens = this.calculateMessageTokens(msg);
        if (systemTokens + msgTokens <= tokenBudget * 0.3) { // Allocate up to 30% of remaining budget for system messages
          optimizedMessages.push(msg);
          systemTokens += msgTokens;
        }
      }
      
      tokenBudget -= systemTokens;
    }
    
    // Now consider remaining non-system messages
    const nonSystemMessages = remainingMessages.filter(msg => 
      msg.role !== 'system' && !optimizedMessages.includes(msg)
    );
    
    // Strategy: Keep every 2nd message pair to maintain some conversation flow
    for (let i = 0; i < nonSystemMessages.length; i += 4) {
      // Try to get a user-assistant pair
      const pair = nonSystemMessages.slice(i, i + 2);
      const pairTokens = this.calculateTotalTokens(pair);
      
      if (pairTokens <= tokenBudget) {
        pair.forEach(msg => optimizedMessages.push(msg));
        tokenBudget -= pairTokens;
      } else {
        // Not enough budget for this pair
        break;
      }
    }
    
    // Sort messages by timestamp to restore chronological order
    return optimizedMessages.sort((a, b) => 
      a.timestamp.getTime() - b.timestamp.getTime()
    );
  }
  
  /**
   * Generate a summary of the conversation
   * @param messages Messages to summarize
   * @returns Summary message
   */
  generateConversationSummary(messages: Message[]): Message {
    // Get a subset of messages to summarize (exclude very recent ones)
    const messagesToSummarize = messages.slice(0, -4);
    
    if (messagesToSummarize.length === 0) {
      return {
        id: `summary_${Date.now()}`,
        role: 'system',
        content: 'The conversation has just started.',
        timestamp: new Date(),
      };
    }
    
    // Count message types
    const userCount = messagesToSummarize.filter(m => m.role === 'user').length;
    const assistantTypes = messagesToSummarize
      .filter(m => m.role === 'assistant' && m.assistantType)
      .reduce((types, m) => {
        const type = m.assistantType!;
        types[type] = (types[type] || 0) + 1;
        return types;
      }, {} as Record<string, number>);
    
    // Determine dominant assistant type
    let dominantType: AssistantType = 'unified';
    let maxCount = 0;
    
    Object.entries(assistantTypes).forEach(([type, count]) => {
      if (count > maxCount) {
        maxCount = count;
        dominantType = type as AssistantType;
      }
    });
    
    // Extract key topics (simplistic approach - production would use LLM)
    const allText = messagesToSummarize
      .map(m => m.content)
      .join(' ')
      .toLowerCase();
    
    // Check for employee-related topics
    const employeeTopics = ['schedule', 'employee', 'time off', 'task', 'performance', 'recognition']
      .filter(topic => allText.includes(topic));
      
    // Check for talent-related topics
    const talentTopics = ['job', 'candidate', 'interview', 'hire', 'recruitment', 'position']
      .filter(topic => allText.includes(topic));
    
    // Build summary
    let summary = `Conversation summary: ${userCount} user messages, predominantly with `;
    
    if (dominantType === 'employee') {
      summary += `the Employee Assistant (Olivia). `;
    } else if (dominantType === 'talent') {
      summary += `the Talent Acquisition Assistant. `;
    } else {
      summary += `the Unified Assistant. `;
    }
    
    if (employeeTopics.length > 0) {
      summary += `Employee topics discussed: ${employeeTopics.join(', ')}. `;
    }
    
    if (talentTopics.length > 0) {
      summary += `Talent topics discussed: ${talentTopics.join(', ')}. `;
    }
    
    return {
      id: `summary_${Date.now()}`,
      role: 'system',
      content: summary,
      timestamp: new Date(),
    };
  }
  
  /**
   * Prepare messages for API request, optimizing for context window
   * @param messages Full message history
   * @param activeAssistant Current active assistant
   * @returns Optimized messages for API request
   */
  prepareMessagesForRequest(messages: Message[], activeAssistant: AssistantType): {
    messages: { role: string; content: string }[];
    includedMessageCount: number;
  } {
    // First optimize message history
    const optimizedMessages = this.optimizeMessageHistory(messages);
    
    // If very long conversation, replace older messages with a summary
    let processedMessages: Message[] = [];
    const shouldSummarize = messages.length > 15 && optimizedMessages.length < messages.length;
    
    if (shouldSummarize) {
      // Generate summary
      const summary = this.generateConversationSummary(messages.slice(0, -6));
      
      // Keep the most recent 6 messages and add summary at the beginning
      processedMessages = [
        summary,
        ...messages.slice(-6)
      ];
    } else {
      processedMessages = optimizedMessages;
    }
    
    // Convert to API format
    const apiMessages = processedMessages
      .filter(msg => msg.role !== 'system') // Remove system messages for API
      .map(msg => ({
        role: msg.role,
        content: msg.content
      }));
    
    return {
      messages: apiMessages,
      includedMessageCount: processedMessages.length
    };
  }
  
  /**
   * Save user preferences
   * @param preferences User preferences to save
   */
  saveUserPreferences(preferences: Record<string, any>): void {
    if (!this.localStorage) return;
    
    try {
      const state = this.loadConversationState() || {
        messages: [],
        activeAssistant: 'unified'
      };
      
      this.saveConversationState({
        ...state,
        preferences: {
          ...state.preferences,
          ...preferences
        }
      });
    } catch (error) {
      console.error('Error saving user preferences:', error);
    }
  }
  
  /**
   * Get saved user preferences
   * @returns User preferences or empty object if not available
   */
  getUserPreferences(): Record<string, any> {
    const state = this.loadConversationState();
    return state?.preferences || {};
  }
  
  /**
   * Save referenced data for future use
   * @param key Data key
   * @param data Data to save
   */
  saveReferencedData(key: string, data: any): void {
    if (!this.localStorage) return;
    
    try {
      const state = this.loadConversationState() || {
        messages: [],
        activeAssistant: 'unified'
      };
      
      this.saveConversationState({
        ...state,
        referencedData: {
          ...state.referencedData,
          [key]: data
        }
      });
    } catch (error) {
      console.error('Error saving referenced data:', error);
    }
  }
  
  /**
   * Get saved referenced data
   * @param key Data key
   * @returns Saved data or null if not available
   */
  getReferencedData(key: string): any {
    const state = this.loadConversationState();
    return state?.referencedData?.[key] || null;
  }
}

// Export a singleton instance
const historyService = new HistoryService();
export default historyService;