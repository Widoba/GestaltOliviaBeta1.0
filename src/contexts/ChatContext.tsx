import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { sendChatRequest } from '../utils/api';
import { 
  constructCustomPrompt, 
  selectPromptByAssistantType 
} from '../utils/promptUtils';
import dataLoaderService from '../services/dataLoaderService';
import historyService from '../services/historyService';
import contextEnhancedAnthropicService from '../services/contextEnhancedAnthropicService';

export type AssistantType = 'unified' | 'employee' | 'talent';

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp: Date;
  assistantType?: AssistantType;
  structuredData?: any;
}

interface ChatContextType {
  messages: Message[];
  isLoading: boolean;
  activeAssistant: AssistantType;
  isNearingContextLimit: boolean;
  sendMessage: (content: string) => Promise<void>;
  clearChat: () => void;
  completeAction: (actionType: string, actionData: any) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

interface ChatProviderProps {
  children: ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeAssistant, setActiveAssistant] = useState<AssistantType>('unified');
  const [isNearingContextLimit, setIsNearingContextLimit] = useState<boolean>(false);

  // Helper to generate a unique ID
  const generateId = () => `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  // Load relevant data based on the user's message
  const loadRelevantData = async (content: string) => {
    try {
      const promptInjectionService = (await import('../services/promptInjectionService')).default;
      return promptInjectionService.prepareDataForPrompt(content);
    } catch (error) {
      console.error('Error loading relevant data:', error);
      return '';
    }
  };

  // Determine which assistant should handle the request
  const determineAssistantType = async (content: string): Promise<AssistantType> => {
    try {
      // Use query analysis service to determine intent and assistant type
      const queryAnalysisService = (await import('../services/queryAnalysisService')).default;
      const analysis = await queryAnalysisService.analyzeQuery(content);
      
      // Return the determined assistant type
      return analysis.assistantType;
    } catch (error) {
      console.error('Error determining assistant type:', error);
      return 'unified'; // Default to unified if there's an error
    }
  };

  // Get the appropriate system prompt based on assistant type and relevant data
  const getSystemPrompt = (assistantType: AssistantType, relevantData: string): string => {
    // Use the utility function to construct a custom prompt
    return constructCustomPrompt(
      assistantType,
      {}, // No dynamic context variables for now
      relevantData
    );
  };

  // Send a message to the assistant
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    try {
      // Import necessary services and utilities
      const fallbackResponseService = (await import('../services/fallbackResponseService')).default;
      const { parseAnthropicError, AnthropicErrorCode } = (await import('../utils/errorHandling')).default;
      
      // First, analyze current context window usage
      const tokenAnalysis = contextEnhancedAnthropicService.analyzeTokenUsage(messages);
      setIsNearingContextLimit(tokenAnalysis.isNearingLimit);
      
      // Add token usage message if needed
      if (tokenAnalysis.recommendedAction !== 'none') {
        const tokenMessage = contextEnhancedAnthropicService.getTokenUsageMessage(tokenAnalysis);
        if (tokenMessage.content) {
          setMessages(prevMessages => [...prevMessages, tokenMessage]);
        }
      }
      
      // Add user message to state
      const userMessage: Message = {
        id: generateId(),
        content,
        role: 'user',
        timestamp: new Date(),
      };
      
      // Update messages state with the new message
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      setIsLoading(true);
      
      // Determine which assistant should handle this message
      // Wrap in try/catch to handle potential errors in assistant type determination
      let newAssistantType: AssistantType;
      try {
        newAssistantType = await determineAssistantType(content);
      } catch (error) {
        console.error('Error determining assistant type:', error);
        // Fall back to current assistant type or unified
        newAssistantType = activeAssistant || 'unified';
      }
      
      // Only add a system message if the assistant type is changing
      if (activeAssistant !== newAssistantType && messages.length > 0) {
        const systemMessage: Message = {
          id: generateId(),
          content: `Switching to ${newAssistantType === 'employee' ? 'Employee Assistant' : 
                    newAssistantType === 'talent' ? 'Talent Acquisition Assistant' : 
                    'Unified Assistant'}`,
          role: 'system',
          timestamp: new Date(),
        };
        
        updatedMessages.push(systemMessage);
        setMessages(updatedMessages);
      }
      
      setActiveAssistant(newAssistantType);
      
      // Load relevant data for the query (with error handling)
      let relevantData = '';
      try {
        relevantData = await loadRelevantData(content);
      } catch (error) {
        console.error('Error loading relevant data:', error);
        // Continue without injected data rather than failing completely
      }
      
      // Get appropriate system prompt
      const systemPrompt = getSystemPrompt(newAssistantType, relevantData);
      
      let response;
      try {
        // Use the enhanced Anthropic service with context management
        response = await contextEnhancedAnthropicService.sendMessage(
          updatedMessages,
          {
            system: systemPrompt,
            activeAssistant: newAssistantType,
            preserveHistory: true,
            trackTokenUsage: true,
            enableFunctionCalling: true
          }
        );
      } catch (error) {
        console.error('Error sending message to Anthropic API:', error);
        
        // Parse the error to get more information
        const parsedError = parseAnthropicError(error);
        parsedError.logError();
        
        // Implement fallback strategies based on error type
        if (parsedError.code === AnthropicErrorCode.CONTEXT_TOO_LONG) {
          // Handle context length errors by summarizing conversation
          // For now, we'll just add a summarization warning and continue with a fallback
          const systemMessage: Message = {
            id: generateId(),
            content: 'The conversation is too long. Some earlier messages have been summarized.',
            role: 'system',
            timestamp: new Date(),
          };
          
          updatedMessages.push(systemMessage);
          setMessages(updatedMessages);
        }
        
        // Get a hierarchical fallback response
        const fallbackMessage = fallbackResponseService.getHierarchicalFallback(
          parsedError,
          newAssistantType,
          content
        );
        
        // Create an assistant message with the fallback response
        const assistantMessage: Message = {
          id: generateId(),
          content: fallbackMessage,
          role: 'assistant',
          timestamp: new Date(),
          assistantType: newAssistantType,
          // Add a flag to indicate this is a fallback
          structuredData: { 
            fallback: true,
            errorCode: parsedError.code,
            errorMessage: parsedError.message
          }
        };
        
        // Update messages with the fallback
        const finalMessages = [...updatedMessages, assistantMessage];
        setMessages(finalMessages);
        
        // Persist conversation state
        historyService.saveConversationState({
          messages: finalMessages,
          activeAssistant: newAssistantType
        });
        
        // Return early since we've handled the error
        setIsLoading(false);
        return;
      }
      
      // If we get here, the API call was successful
      // Add assistant response to state
      const assistantMessage: Message = {
        id: generateId(),
        content: response.content,
        role: 'assistant',
        timestamp: new Date(),
        assistantType: newAssistantType,
        structuredData: response.structuredData
      };
      
      // Update messages with assistant response
      const finalMessages = [...updatedMessages, assistantMessage];
      setMessages(finalMessages);
      
      // Persist conversation state
      historyService.saveConversationState({
        messages: finalMessages,
        activeAssistant: newAssistantType
      });
      
      // Update context limit flag based on response metadata
      if (response.contextMetadata) {
        const percentUsed = (response.contextMetadata.totalTokens / 100000) * 100;
        setIsNearingContextLimit(percentUsed > 60);
      }
      
    } catch (error) {
      // This catch handles unexpected errors not caught by the inner try/catch blocks
      console.error('Unhandled error in message processing:', error);
      
      // Add generic error message
      const errorMessage: Message = {
        id: generateId(),
        content: 'Sorry, there was an unexpected error processing your request. Our team has been notified. Please try again.',
        role: 'system',
        timestamp: new Date(),
      };
      
      setMessages(prevMessages => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, activeAssistant]);

  // Handle user actions (button clicks, form submissions, etc.)
  const completeAction = useCallback(async (actionType: string, actionData: any) => {
    setIsLoading(true);
    try {
      // Import necessary services and utilities
      const functionCallingService = (await import('../services/functionCallingService')).default;
      const fallbackResponseService = (await import('../services/fallbackResponseService')).default;
      const { parseAnthropicError, AnthropicErrorCode, createActionError } = (await import('../utils/errorHandling')).default;
      
      // Create a tool call object based on the action type
      let toolCall;
      
      switch (actionType) {
        case 'completeTask':
          toolCall = {
            id: `call_${Date.now()}`,
            name: 'completeTask',
            input: actionData
          };
          break;
        case 'approveShiftSwap':
          toolCall = {
            id: `call_${Date.now()}`,
            name: 'approveShiftSwap',
            input: actionData
          };
          break;
        case 'recognizeEmployee':
          toolCall = {
            id: `call_${Date.now()}`,
            name: 'recognizeEmployee',
            input: actionData
          };
          break;
        case 'scheduleInterview':
          toolCall = {
            id: `call_${Date.now()}`,
            name: 'scheduleInterview',
            input: actionData
          };
          break;
        default:
          throw createActionError(
            `Unknown action type: ${actionType}`,
            actionType,
            'The requested action is not supported',
            false
          );
      }
      
      // Execute the tool call
      const result = await functionCallingService.executeToolCall(toolCall);
      
      // Check if the action failed
      if (result.error) {
        throw createActionError(
          result.message || `Action ${actionType} failed`,
          actionType,
          result.details || 'No additional details available',
          result.recoverable !== false // Default to recoverable if not specified
        );
      }
      
      // Create a system message for the successful action
      const systemMessage: Message = {
        id: generateId(),
        content: result.message || `Action ${actionType} completed successfully.`,
        role: 'system',
        timestamp: new Date(),
        structuredData: { actionResult: { ...result, dataType: 'actionResult' } }
      };
      
      // Add the system message to the chat
      setMessages(prevMessages => [...prevMessages, systemMessage]);
      
      // Send a follow-up message asking Claude to acknowledge and respond
      // Create an implicit message (not shown to user)
      const implicitMessage: Message = {
        id: generateId(),
        content: `The user has completed an action: ${actionType} with result: ${JSON.stringify(result)}. Please acknowledge this action and provide any follow-up information or next steps.`,
        role: 'user',
        timestamp: new Date(),
      };
      
      // We don't add this to the visible message array, but send it to the API
      const newMessages = [...messages, systemMessage, implicitMessage];
      
      // Get appropriate system prompt
      const systemPrompt = getSystemPrompt(activeAssistant, '');
      
      try {
        // Get a response from Claude acknowledging the action
        const response = await contextEnhancedAnthropicService.sendMessage(
          newMessages,
          {
            system: systemPrompt,
            activeAssistant,
            preserveHistory: true,
            trackTokenUsage: true,
            enableFunctionCalling: true
          }
        );
        
        // Add Claude's response to the chat
        const assistantMessage: Message = {
          id: generateId(),
          content: response.content,
          role: 'assistant',
          timestamp: new Date(),
          assistantType: activeAssistant,
          structuredData: response.structuredData
        };
        
        // Add only the system message and Claude's response
        const finalMessages = [...messages, systemMessage, assistantMessage];
        setMessages(finalMessages);
        
        // Persist conversation state
        historyService.saveConversationState({
          messages: finalMessages,
          activeAssistant
        });
      } catch (apiError) {
        // If we can't get Claude's acknowledgment, we still proceed with the action result
        console.error('Error getting action acknowledgment from Claude:', apiError);
        
        // Parse the error
        const parsedError = parseAnthropicError(apiError);
        parsedError.logError();
        
        // Just add a generic acknowledgment instead of failing completely
        const assistantMessage: Message = {
          id: generateId(),
          content: `I've ${actionType === 'completeTask' ? 'marked the task as complete' : 
                   actionType === 'approveShiftSwap' ? 'processed the shift swap request' :
                   actionType === 'recognizeEmployee' ? 'recorded the employee recognition' :
                   actionType === 'scheduleInterview' ? 'scheduled the interview' : 
                   'completed the action'} successfully.`,
          role: 'assistant',
          timestamp: new Date(),
          assistantType: activeAssistant
        };
        
        // Add system message and generic acknowledgment
        const finalMessages = [...messages, systemMessage, assistantMessage];
        setMessages(finalMessages);
        
        // Persist conversation state
        historyService.saveConversationState({
          messages: finalMessages,
          activeAssistant
        });
      }
    } catch (error) {
      console.error('Error completing action:', error);
      
      let errorMessage: Message;
      
      // If it's a known action error, provide a specific message
      if (error.name === 'ActionError' && error.getUserMessage) {
        errorMessage = {
          id: generateId(),
          content: error.getUserMessage(),
          role: 'system',
          timestamp: new Date(),
          structuredData: {
            error: true,
            actionType,
            errorCode: error.code,
            errorMessage: error.message,
            recoverable: error.recoverable
          }
        };
      } else {
        // Generic error message for unknown errors
        errorMessage = {
          id: generateId(),
          content: `Sorry, there was an error completing the ${actionType} action. Please try again.`,
          role: 'system',
          timestamp: new Date(),
          structuredData: {
            error: true,
            actionType,
            errorMessage: error.message || 'Unknown error'
          }
        };
      }
      
      setMessages(prevMessages => [...prevMessages, errorMessage]);
      
      // If the error is not recoverable, add an assistant message with guidance
      if (error.recoverable === false) {
        // Create a message that guides the user on what to do next
        const assistantMessage: Message = {
          id: generateId(),
          content: `I encountered an issue while trying to ${actionType === 'completeTask' ? 'complete the task' : 
                   actionType === 'approveShiftSwap' ? 'process the shift swap' :
                   actionType === 'recognizeEmployee' ? 'recognize the employee' :
                   actionType === 'scheduleInterview' ? 'schedule the interview' : 
                   'complete the action'}. ${
                     error.message || 'Would you like to try a different approach?'
                   }`,
          role: 'assistant',
          timestamp: new Date(),
          assistantType: activeAssistant
        };
        
        // Add the assistant guidance message
        setMessages(prevMessages => [...prevMessages, errorMessage, assistantMessage]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [messages, activeAssistant]);

  // Clear the chat history
  const clearChat = useCallback(() => {
    setMessages([]);
    setActiveAssistant('unified');
    setIsNearingContextLimit(false);
    historyService.clearConversationState();
  }, []);

  return (
    <ChatContext.Provider 
      value={{ 
        messages, 
        isLoading, 
        activeAssistant,
        isNearingContextLimit,
        sendMessage, 
        clearChat,
        completeAction
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

// Custom hook for using the chat context
export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};