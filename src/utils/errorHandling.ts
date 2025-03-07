/**
 * Error codes that can be returned by the Anthropic API
 */
export enum AnthropicErrorCode {
  INVALID_API_KEY = 'invalid_api_key',
  CONTEXT_TOO_LONG = 'context_too_long',
  CONTENT_POLICY = 'content_policy',
  RATE_LIMIT = 'rate_limit',
  SERVICE_UNAVAILABLE = 'service_unavailable',
  UNKNOWN = 'unknown',
}

/**
 * Custom error class for Anthropic API errors
 */
export class AnthropicError extends Error {
  code: AnthropicErrorCode;
  status?: number;
  retryAfter?: number;

  constructor(
    message: string, 
    code: AnthropicErrorCode = AnthropicErrorCode.UNKNOWN, 
    status?: number,
    retryAfter?: number
  ) {
    super(message);
    this.name = 'AnthropicError';
    this.code = code;
    this.status = status;
    this.retryAfter = retryAfter;
  }

  /**
   * Determines if this error is retryable
   */
  isRetryable(): boolean {
    return (
      this.code === AnthropicErrorCode.RATE_LIMIT ||
      this.code === AnthropicErrorCode.SERVICE_UNAVAILABLE ||
      (this.status !== undefined && (this.status >= 500 && this.status < 600))
    );
  }

  /**
   * Returns a user-friendly error message
   */
  getUserMessage(): string {
    switch (this.code) {
      case AnthropicErrorCode.INVALID_API_KEY:
        return 'There was an authentication problem. Please check your API key.';
      case AnthropicErrorCode.CONTEXT_TOO_LONG:
        return 'The conversation history is too long. Please start a new conversation.';
      case AnthropicErrorCode.CONTENT_POLICY:
        return 'The request was rejected for content policy reasons.';
      case AnthropicErrorCode.RATE_LIMIT:
        return 'Too many requests. Please try again in a moment.';
      case AnthropicErrorCode.SERVICE_UNAVAILABLE:
        return 'The service is currently unavailable. Please try again later.';
      default:
        return 'An error occurred. Please try again later.';
    }
  }
}

/**
 * Parses an error from the Anthropic API
 * @param error The error to parse
 * @returns A structured AnthropicError
 */
export function parseAnthropicError(error: any): AnthropicError {
  // If it's already an AnthropicError, return it
  if (error instanceof AnthropicError) {
    return error;
  }

  // Extract error details
  const status = error.status || error.statusCode;
  const body = error.response?.body || error.body || {};
  const errorType = body.error?.type || '';
  const errorMessage = body.error?.message || error.message || 'Unknown error';
  const retryAfter = parseInt(error.response?.headers?.['retry-after'] || '0');

  // Determine error code
  let code = AnthropicErrorCode.UNKNOWN;
  
  if (errorType === 'authentication_error' || status === 401) {
    code = AnthropicErrorCode.INVALID_API_KEY;
  } else if (errorType === 'context_length_exceeded' || errorMessage.includes('context length')) {
    code = AnthropicErrorCode.CONTEXT_TOO_LONG;
  } else if (errorType === 'content_policy_violation' || status === 400) {
    code = AnthropicErrorCode.CONTENT_POLICY;
  } else if (errorType === 'rate_limit_exceeded' || status === 429) {
    code = AnthropicErrorCode.RATE_LIMIT;
  } else if (status >= 500 && status < 600) {
    code = AnthropicErrorCode.SERVICE_UNAVAILABLE;
  }

  return new AnthropicError(errorMessage, code, status, retryAfter);
}

export default {
  AnthropicErrorCode,
  AnthropicError,
  parseAnthropicError,
};