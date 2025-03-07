import { AnthropicErrorCode, ErrorCategory } from '../utils/errorHandling';
import { AssistantType } from '../contexts/ChatContext';

/**
 * Service to provide fallback responses when the primary response method fails
 */
class FallbackResponseService {
  /**
   * Get a fallback response based on the error and current context
   * @param error The error that occurred
   * @param assistantType Current assistant type
   * @param lastUserMessage Last message from the user
   * @returns Fallback response text or null if no fallback is available
   */
  getFallbackResponse(
    error: any,
    assistantType: AssistantType,
    lastUserMessage: string
  ): string | null {
    // Extract error code and category if available
    const errorCode = error.code || AnthropicErrorCode.UNKNOWN;
    const errorCategory = error.category || ErrorCategory.SYSTEM;
    
    // Start with generic fallbacks based on error code
    const genericFallback = this.getGenericFallback(errorCode);
    
    // If there's a specific fallback for this assistant type, use it
    const assistantSpecificFallback = this.getAssistantSpecificFallback(
      errorCode, 
      assistantType,
      lastUserMessage
    );
    
    // Return the most specific fallback available
    return assistantSpecificFallback || genericFallback;
  }
  
  /**
   * Get a generic fallback response based on error code
   * @param errorCode Error code
   * @returns Generic fallback response
   */
  private getGenericFallback(errorCode: string): string {
    switch (errorCode) {
      case AnthropicErrorCode.INVALID_API_KEY:
        return "I'm currently experiencing authentication issues. Please try again later while our team resolves this.";
      
      case AnthropicErrorCode.CONTEXT_TOO_LONG:
        return "Our conversation has become quite lengthy, which is causing some technical challenges. Let's start a new conversation for better results.";
      
      case AnthropicErrorCode.CONTENT_POLICY:
        return "I'm not able to respond to that request due to content policy restrictions. Is there something else I can help you with?";
      
      case AnthropicErrorCode.RATE_LIMIT:
        return "I'm currently receiving a high volume of requests. Please try again in a moment when things are less busy.";
      
      case AnthropicErrorCode.SERVICE_UNAVAILABLE:
        return "My service is temporarily unavailable. This should be resolved shortly. Please try again in a few minutes.";
      
      case AnthropicErrorCode.TIMEOUT:
        return "Your request took longer than expected to process. Please try again with a simpler question, or try again later.";
      
      case AnthropicErrorCode.NETWORK_ERROR:
        return "I'm having trouble connecting to my knowledge services. Please check your internet connection and try again.";
      
      case AnthropicErrorCode.FUNCTION_EXECUTION_ERROR:
        return "I wasn't able to retrieve the information you requested. Let's try a different approach.";
      
      case AnthropicErrorCode.DATA_NOT_FOUND:
        return "I couldn't find the specific information you're looking for. Could you try rephrasing your request or asking for something else?";
      
      case AnthropicErrorCode.PARTIAL_DATA:
        return "I was only able to retrieve part of the information you requested. I'll share what I found, but it may not be complete.";
      
      case AnthropicErrorCode.ACTION_FAILED:
        return "I wasn't able to complete the requested action. Please try again or consider an alternative approach.";
      
      case AnthropicErrorCode.VALIDATION_ERROR:
        return "There was an issue with the request parameters. Could you provide more specific details?";
      
      case AnthropicErrorCode.BAD_REQUEST:
        return "I couldn't process your request as formatted. Let's try a different approach.";
      
      default:
        return "I'm experiencing a technical issue right now. Please try again in a moment, or ask a different question.";
    }
  }
  
  /**
   * Get an assistant-specific fallback response
   * @param errorCode Error code
   * @param assistantType Current assistant type
   * @param lastUserMessage Last message from the user
   * @returns Assistant-specific fallback or null
   */
  private getAssistantSpecificFallback(
    errorCode: string,
    assistantType: AssistantType,
    lastUserMessage: string
  ): string | null {
    // Check for employee assistant specific fallbacks
    if (assistantType === 'employee') {
      if (errorCode === AnthropicErrorCode.DATA_NOT_FOUND) {
        return "I couldn't find the employee data you're looking for. The employee might not be in our system, or there might be a data access issue. Would you like me to help with something else related to employee management?";
      }
      
      if (errorCode === AnthropicErrorCode.ACTION_FAILED && lastUserMessage.toLowerCase().includes('schedule')) {
        return "I wasn't able to update the schedule as requested. This could be due to a scheduling conflict or permissions issue. Could you try a different approach or check the schedule manually?";
      }
    }
    
    // Check for talent assistant specific fallbacks
    if (assistantType === 'talent') {
      if (errorCode === AnthropicErrorCode.DATA_NOT_FOUND && lastUserMessage.toLowerCase().includes('candidate')) {
        return "I couldn't find the candidate information you're looking for. The candidate might not be in our system yet, or their profile might be incomplete. Would you like me to help with other recruitment tasks?";
      }
      
      if (errorCode === AnthropicErrorCode.ACTION_FAILED && lastUserMessage.toLowerCase().includes('interview')) {
        return "I wasn't able to schedule the interview as requested. This could be due to a calendar conflict or missing information. Could you check the calendar availability and try again?";
      }
    }
    
    // No specific fallback for this combination
    return null;
  }
  
  /**
   * Get a dynamic fallback response that tries to be helpful despite errors
   * @param lastUserMessage Last message from the user
   * @returns Dynamic fallback response
   */
  getDynamicFallback(lastUserMessage: string): string {
    // Analyze the user's message to determine a helpful fallback
    const lowerMessage = lastUserMessage.toLowerCase();
    
    // Check for common topics and provide generic but helpful responses
    if (lowerMessage.includes('schedule') || lowerMessage.includes('shift')) {
      return "I'm having trouble accessing scheduling information right now. In the meantime, is there something specific about scheduling you'd like me to explain, such as how shift swaps work or scheduling best practices?";
    }
    
    if (lowerMessage.includes('employee') || lowerMessage.includes('team member')) {
      return "I'm having difficulty retrieving employee information at the moment. While we wait for the system to recover, would you like to discuss general employee management strategies or best practices for team leadership?";
    }
    
    if (lowerMessage.includes('candidate') || lowerMessage.includes('application') || lowerMessage.includes('recruit')) {
      return "I'm currently unable to access candidate information. While we wait for this to be resolved, would you like me to share some interview question suggestions or recruitment best practices?";
    }
    
    if (lowerMessage.includes('task') || lowerMessage.includes('todo')) {
      return "I can't access your task list right now. In the meantime, would you like some tips on task prioritization or effective task management?";
    }
    
    // Default helpful fallback
    return "I'm having trouble providing the specific information you requested. While we work on resolving this, is there a related topic I could help you with, or would you like some general advice on employee management or recruitment?";
  }
  
  /**
   * Get a hierarchical fallback response, trying increasingly generic approaches
   * @param error The error that occurred
   * @param assistantType Current assistant type
   * @param lastUserMessage Last message from the user
   * @returns The best available fallback response
   */
  getHierarchicalFallback(
    error: any,
    assistantType: AssistantType,
    lastUserMessage: string
  ): string {
    // Try to get a specific fallback for this error
    const specificFallback = this.getFallbackResponse(error, assistantType, lastUserMessage);
    
    // If available, use the specific fallback
    if (specificFallback) {
      return specificFallback;
    }
    
    // Otherwise, try a dynamic fallback based on the user's message
    const dynamicFallback = this.getDynamicFallback(lastUserMessage);
    
    // If available, use the dynamic fallback
    if (dynamicFallback) {
      return dynamicFallback;
    }
    
    // Last resort: generic apology
    return "I apologize, but I'm experiencing technical difficulties right now. Please try again in a moment.";
  }
}

// Export a singleton instance
const fallbackResponseService = new FallbackResponseService();
export default fallbackResponseService;