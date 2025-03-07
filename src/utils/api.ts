import { Message } from '../services/anthropicService';

/**
 * Interface for chat API requests
 */
export interface ChatRequest {
  messages: Message[];
  system?: string;
}

/**
 * Interface for chat API responses
 */
export interface ChatResponse {
  message: string;
  model: string;
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
}

/**
 * Interface for API errors
 */
export interface ApiError {
  error: string;
}

/**
 * Sends a chat request to the API
 * @param request Chat request object
 * @returns Promise with the chat response
 */
export async function sendChatRequest(request: ChatRequest): Promise<ChatResponse> {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json() as ApiError;
      throw new Error(errorData.error || `API error: ${response.status}`);
    }

    return await response.json() as ChatResponse;
  } catch (error) {
    console.error('Error sending chat request:', error);
    throw error;
  }
}

export default {
  sendChatRequest,
};