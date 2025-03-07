/**
 * Error codes that can be returned by the Anthropic API
 */
export enum AnthropicErrorCode {
  INVALID_API_KEY = 'invalid_api_key',
  CONTEXT_TOO_LONG = 'context_too_long',
  CONTENT_POLICY = 'content_policy',
  RATE_LIMIT = 'rate_limit',
  SERVICE_UNAVAILABLE = 'service_unavailable',
  BAD_REQUEST = 'bad_request',
  TIMEOUT = 'timeout',
  NETWORK_ERROR = 'network_error',
  FUNCTION_EXECUTION_ERROR = 'function_execution_error',
  DATA_NOT_FOUND = 'data_not_found',
  PARTIAL_DATA = 'partial_data',
  ACTION_FAILED = 'action_failed',
  VALIDATION_ERROR = 'validation_error',
  UNKNOWN = 'unknown',
}

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  FATAL = 'fatal',     // Unrecoverable error, no retry possible
  ERROR = 'error',     // Serious error, but potentially retryable
  WARNING = 'warning', // Issue that doesn't prevent operation but should be addressed
  INFO = 'info'        // Informational issue, lowest severity
}

/**
 * Error categories for grouping different error types
 */
export enum ErrorCategory {
  API = 'api',             // API-related errors
  NETWORK = 'network',     // Network or connectivity issues
  DATA = 'data',           // Data access or integrity issues
  USER_ACTION = 'action',  // Errors from user actions
  SYSTEM = 'system',       // Internal system errors
  VALIDATION = 'validation' // Input validation errors
}

/**
 * Custom error class for Anthropic API errors
 */
export class AnthropicError extends Error {
  code: AnthropicErrorCode;
  status?: number;
  retryAfter?: number;
  severity: ErrorSeverity;
  category: ErrorCategory;
  retryCount?: number;
  context?: Record<string, any>;
  recoverable: boolean;

  constructor(
    message: string, 
    code: AnthropicErrorCode = AnthropicErrorCode.UNKNOWN, 
    status?: number,
    retryAfter?: number,
    severity: ErrorSeverity = ErrorSeverity.ERROR,
    category: ErrorCategory = ErrorCategory.API,
    retryCount?: number,
    context?: Record<string, any>,
    recoverable: boolean = true
  ) {
    super(message);
    this.name = 'AnthropicError';
    this.code = code;
    this.status = status;
    this.retryAfter = retryAfter;
    this.severity = severity;
    this.category = category;
    this.retryCount = retryCount;
    this.context = context;
    this.recoverable = recoverable;
  }

  /**
   * Determines if this error is retryable
   */
  isRetryable(): boolean {
    // Check if the error is explicitly marked as non-recoverable
    if (!this.recoverable) {
      return false;
    }

    // Check based on error code
    return (
      this.code === AnthropicErrorCode.RATE_LIMIT ||
      this.code === AnthropicErrorCode.SERVICE_UNAVAILABLE ||
      this.code === AnthropicErrorCode.NETWORK_ERROR ||
      this.code === AnthropicErrorCode.TIMEOUT ||
      (this.status !== undefined && (this.status >= 500 && this.status < 600))
    );
  }

  /**
   * Returns a user-friendly error message
   */
  getUserMessage(): string {
    switch (this.code) {
      case AnthropicErrorCode.INVALID_API_KEY:
        return 'There was an authentication problem. Our team has been notified.';
      case AnthropicErrorCode.CONTEXT_TOO_LONG:
        return 'This conversation is getting quite long. Consider starting a new conversation for best results.';
      case AnthropicErrorCode.CONTENT_POLICY:
        return 'I cannot respond to this request due to content policy restrictions.';
      case AnthropicErrorCode.RATE_LIMIT:
        return 'The system is experiencing high demand. Please try again in a moment.';
      case AnthropicErrorCode.SERVICE_UNAVAILABLE:
        return 'The assistant service is temporarily unavailable. Please try again shortly.';
      case AnthropicErrorCode.TIMEOUT:
        return 'The request timed out. Please try a simpler question or try again later.';
      case AnthropicErrorCode.NETWORK_ERROR:
        return 'There was a problem connecting to the service. Please check your internet connection.';
      case AnthropicErrorCode.FUNCTION_EXECUTION_ERROR:
        return 'There was a problem processing your request. Please try again.';
      case AnthropicErrorCode.DATA_NOT_FOUND:
        return 'The requested information could not be found. Please try a different query.';
      case AnthropicErrorCode.PARTIAL_DATA:
        return 'Some information was unavailable. I\'ve provided what I could find.';
      case AnthropicErrorCode.ACTION_FAILED:
        return 'The requested action could not be completed. Please try again.';
      case AnthropicErrorCode.VALIDATION_ERROR:
        return 'There was a problem with your input. Please check and try again.';
      case AnthropicErrorCode.BAD_REQUEST:
        return 'There was a problem with the request. Please try again with different parameters.';
      default:
        return 'Something went wrong. Please try again or contact support if the problem persists.';
    }
  }

  /**
   * Returns a fallback response based on the error type
   */
  getFallbackResponse(): string {
    switch (this.category) {
      case ErrorCategory.API:
        return "I'm having trouble connecting to my knowledge services right now. I can still help with general questions or we can try again later.";
      case ErrorCategory.DATA:
        return "I couldn't retrieve all the data you requested. Let me know if you'd like to try a different approach.";
      case ErrorCategory.USER_ACTION:
        return "I wasn't able to complete that action. Is there another way I can help you with this task?";
      case ErrorCategory.VALIDATION:
        return "I need some clarification. Could you provide more details about what you're looking for?";
      default:
        return "I encountered an unexpected issue. Let me know if you'd like to try again or take a different approach.";
    }
  }

  /**
   * Returns the recommended wait time before retrying
   */
  getRetryDelay(): number {
    // If a specific retry-after was provided, use it
    if (this.retryAfter && this.retryAfter > 0) {
      return this.retryAfter * 1000; // Convert to milliseconds
    }

    // Calculate delay with exponential backoff (if retry count is available)
    if (this.retryCount !== undefined) {
      const baseDelay = 1000; // 1 second base delay
      const maxDelay = 30000; // 30 seconds max delay
      
      // Exponential backoff: 2^retryCount * baseDelay with jitter
      const calculatedDelay = Math.min(
        maxDelay,
        Math.pow(2, this.retryCount) * baseDelay
      );
      
      // Add jitter (±25%)
      const jitter = calculatedDelay * 0.25 * (Math.random() - 0.5);
      return Math.max(baseDelay, calculatedDelay + jitter);
    }

    // Default delay if no other information is available
    return 2000; // 2 seconds
  }

  /**
   * Logs the error with appropriate level
   */
  logError(): void {
    const errorDetails = {
      code: this.code,
      message: this.message,
      status: this.status,
      severity: this.severity,
      category: this.category,
      context: this.context,
      timestamp: new Date().toISOString()
    };

    switch (this.severity) {
      case ErrorSeverity.FATAL:
        console.error('FATAL ERROR:', errorDetails);
        break;
      case ErrorSeverity.ERROR:
        console.error('ERROR:', errorDetails);
        break;
      case ErrorSeverity.WARNING:
        console.warn('WARNING:', errorDetails);
        break;
      case ErrorSeverity.INFO:
        console.info('INFO:', errorDetails);
        break;
    }

    // In a production environment, you would send these logs to a monitoring service
    // Example: sendToMonitoringService(errorDetails);
  }
}

/**
 * Custom error class for data-related errors
 */
export class DataError extends AnthropicError {
  constructor(
    message: string,
    code: AnthropicErrorCode = AnthropicErrorCode.DATA_NOT_FOUND,
    context?: Record<string, any>,
    recoverable: boolean = true
  ) {
    super(
      message,
      code,
      undefined,
      undefined,
      code === AnthropicErrorCode.DATA_NOT_FOUND ? ErrorSeverity.WARNING : ErrorSeverity.ERROR,
      ErrorCategory.DATA,
      undefined,
      context,
      recoverable
    );
    this.name = 'DataError';
  }
}

/**
 * Custom error class for user action errors
 */
export class ActionError extends AnthropicError {
  constructor(
    message: string,
    actionType: string,
    details?: string,
    recoverable: boolean = true
  ) {
    super(
      message,
      AnthropicErrorCode.ACTION_FAILED,
      undefined,
      undefined,
      recoverable ? ErrorSeverity.WARNING : ErrorSeverity.ERROR,
      ErrorCategory.USER_ACTION,
      undefined,
      { actionType, details },
      recoverable
    );
    this.name = 'ActionError';
  }

  /**
   * Returns a user-friendly error message specific to the action
   */
  override getUserMessage(): string {
    const actionType = this.context?.actionType;
    if (actionType) {
      switch (actionType) {
        case 'completeTask':
          return 'There was a problem marking the task as complete. Please try again.';
        case 'approveShiftSwap':
          return 'The shift swap request could not be processed. Please try again.';
        case 'scheduleInterview':
          return 'There was an issue scheduling the interview. Please check the details and try again.';
        case 'recognizeEmployee':
          return 'The employee recognition could not be processed. Please try again.';
        default:
          return `The ${actionType} action could not be completed. Please try again.`;
      }
    }
    return super.getUserMessage();
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

  // Determine error code and category
  let code = AnthropicErrorCode.UNKNOWN;
  let category = ErrorCategory.API;
  let severity = ErrorSeverity.ERROR;
  let recoverable = true;
  
  if (errorType === 'authentication_error' || status === 401) {
    code = AnthropicErrorCode.INVALID_API_KEY;
    severity = ErrorSeverity.FATAL;
    recoverable = false;
  } else if (errorType === 'context_length_exceeded' || errorMessage.includes('context length')) {
    code = AnthropicErrorCode.CONTEXT_TOO_LONG;
    severity = ErrorSeverity.ERROR;
  } else if (errorType === 'content_policy_violation' || status === 400) {
    code = AnthropicErrorCode.CONTENT_POLICY;
    severity = ErrorSeverity.ERROR;
    recoverable = false;
  } else if (errorType === 'rate_limit_exceeded' || status === 429) {
    code = AnthropicErrorCode.RATE_LIMIT;
    severity = ErrorSeverity.WARNING;
  } else if (status >= 500 && status < 600) {
    code = AnthropicErrorCode.SERVICE_UNAVAILABLE;
    severity = ErrorSeverity.ERROR;
  } else if (error.name === 'TimeoutError' || errorMessage.includes('timeout')) {
    code = AnthropicErrorCode.TIMEOUT;
    category = ErrorCategory.NETWORK;
  } else if (error.name === 'NetworkError' || error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
    code = AnthropicErrorCode.NETWORK_ERROR;
    category = ErrorCategory.NETWORK;
  } else if (status === 400) {
    code = AnthropicErrorCode.BAD_REQUEST;
    severity = ErrorSeverity.WARNING;
  }

  // Extract additional context info if available
  const context: Record<string, any> = {};
  if (error.config) {
    context.url = error.config.url;
    context.method = error.config.method;
  }
  if (error.request) {
    context.requestId = error.request.id;
  }

  return new AnthropicError(
    errorMessage, 
    code, 
    status, 
    retryAfter,
    severity,
    category,
    0, // Initial retry count
    context,
    recoverable
  );
}

/**
 * Creates a data error for handling data-related issues
 * @param message Error message
 * @param code Specific error code
 * @param context Additional context
 * @returns A structured DataError
 */
export function createDataError(
  message: string,
  code: AnthropicErrorCode = AnthropicErrorCode.DATA_NOT_FOUND,
  context?: Record<string, any>
): DataError {
  return new DataError(message, code, context);
}

/**
 * Creates an action error for handling user action failures
 * @param message Error message
 * @param actionType Type of action that failed
 * @param details Additional details about the failure
 * @param recoverable Whether the action can be retried
 * @returns A structured ActionError
 */
export function createActionError(
  message: string,
  actionType: string,
  details?: string,
  recoverable: boolean = true
): ActionError {
  return new ActionError(message, actionType, details, recoverable);
}

export default {
  AnthropicErrorCode,
  ErrorSeverity,
  ErrorCategory,
  AnthropicError,
  DataError,
  ActionError,
  parseAnthropicError,
  createDataError,
  createActionError,
};