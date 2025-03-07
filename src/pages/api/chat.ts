import type { NextApiRequest, NextApiResponse } from 'next';
import anthropicService, { Message } from '../../services/anthropicService';
import { BASE_SYSTEM_PROMPT } from '../../utils/promptUtils';

type ChatRequest = {
  messages: Message[];
  system?: string;
};

type ChatResponse = {
  message: string;
  model: string;
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
};

type ErrorResponse = {
  error: string;
};

/**
 * API handler for chat messages
 * @param req NextApiRequest
 * @param res NextApiResponse
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ChatResponse | ErrorResponse>
) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages, system } = req.body as ChatRequest;
    
    // Validate request
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Invalid messages array' });
    }

    // Send the message to the Anthropic API
    const response = await anthropicService.sendMessage(messages, {
      system: system || BASE_SYSTEM_PROMPT,
      temperature: 0.7,
      maxTokens: 4000,
    });

    // Return the response
    return res.status(200).json({
      message: response.content,
      model: response.model,
      usage: response.usage,
    });
  } catch (error) {
    console.error('Error processing chat request:', error);
    
    // Format error message
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'An unknown error occurred';
    
    return res.status(500).json({ error: errorMessage });
  }
}