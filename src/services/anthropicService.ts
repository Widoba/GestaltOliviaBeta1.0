import { Anthropic } from '@anthropic-ai/sdk';

// TypeScript interfaces for message handling
export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface AnthropicResponse {
  content: string;
  model: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

export interface AnthropicAPIOptions {
  temperature?: number;
  maxTokens?: number;
  system?: string;
  retries?: number;
}

// Default configuration
const DEFAULT_CONFIG = {
  MODEL: 'claude-3-7-sonnet-20250219',
  TEMPERATURE: 0.7,
  MAX_TOKENS: 4000,
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 1000,
};

/**
 * AnthropicService - Handles all communication with the Anthropic API
 */
class AnthropicService {
  private client: Anthropic;
  private defaultSystemPrompt: string;

  constructor() {
    // Check if the API key is set
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('ANTHROPIC_API_KEY is not set in environment variables');
      throw new Error('ANTHROPIC_API_KEY is not set in environment variables');
    }

    // Initialize the Anthropic client
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    // Set the default system prompt
    this.defaultSystemPrompt = 
      "You are a helpful assistant that supports both employee assistance and talent acquisition functions. " +
      "Respond to the user's questions in a friendly, professional manner.";
  }

  /**
   * Updates the default system prompt
   * @param newPrompt The new system prompt to use
   */
  setSystemPrompt(newPrompt: string): void {
    this.defaultSystemPrompt = newPrompt;
  }

  /**
   * Formats a system prompt with dynamic data
   * @param prompt Base system prompt
   * @param data Dynamic data to insert into the prompt
   * @returns Formatted system prompt
   */
  formatSystemPrompt(prompt: string, data: Record<string, any> = {}): string {
    let formattedPrompt = prompt;
    Object.entries(data).forEach(([key, value]) => {
      formattedPrompt = formattedPrompt.replace(new RegExp(`{${key}}`, 'g'), String(value));
    });
    return formattedPrompt;
  }

  /**
   * Sends messages to the Anthropic API and returns the response
   * Implements retry logic for transient failures
   * @param messages Array of messages to send
   * @param options Optional configuration for the API call
   * @returns Promise resolving to the API response
   */
  async sendMessage(
    messages: Message[],
    options: AnthropicAPIOptions = {}
  ): Promise<AnthropicResponse> {
    const maxRetries = options.retries || DEFAULT_CONFIG.MAX_RETRIES;
    let attempt = 0;
    let lastError: Error | null = null;

    while (attempt < maxRetries) {
      try {
        const response = await this.client.messages.create({
          model: DEFAULT_CONFIG.MODEL,
          messages: messages,
          temperature: options.temperature ?? DEFAULT_CONFIG.TEMPERATURE,
          max_tokens: options.maxTokens ?? DEFAULT_CONFIG.MAX_TOKENS,
          system: options.system ?? this.defaultSystemPrompt,
        });

        return {
          content: response.content[0].text,
          model: response.model,
          usage: response.usage,
        };
      } catch (error) {
        attempt++;
        lastError = error as Error;
        
        // Log the error
        console.error(`API call failed (attempt ${attempt}/${maxRetries}):`, error);
        
        // Check if we should retry based on error type
        if (this.shouldRetry(error) && attempt < maxRetries) {
          // Exponential backoff with jitter
          const delay = this.calculateBackoff(attempt);
          console.log(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          break;
        }
      }
    }

    // If we've exhausted retries, throw the last error
    throw new Error(`Failed to get a response after ${maxRetries} attempts: ${lastError?.message}`);
  }

  /**
   * Determines if an error is retryable
   * @param error The error to check
   * @returns True if the error is retryable, false otherwise
   */
  private shouldRetry(error: any): boolean {
    // Network errors or 429 (rate limit) or 5xx errors are retryable
    if (!error.status) return true; // Network error
    return error.status === 429 || (error.status >= 500 && error.status < 600);
  }

  /**
   * Calculates backoff time with exponential increase and jitter
   * @param attempt Current attempt number
   * @returns Delay in milliseconds
   */
  private calculateBackoff(attempt: number): number {
    const baseDelay = DEFAULT_CONFIG.RETRY_DELAY_MS;
    const maxDelay = 30000; // 30 seconds max delay
    
    // Exponential backoff: 2^attempt * baseDelay
    let delay = Math.min(
      maxDelay,
      Math.pow(2, attempt) * baseDelay
    );
    
    // Add jitter (±25%)
    const jitter = delay * 0.25 * (Math.random() - 0.5);
    delay = Math.max(baseDelay, delay + jitter);
    
    return delay;
  }
}

// Export a singleton instance
const anthropicService = new AnthropicService();
export default anthropicService;