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
}

interface ChatContextType {
  messages: Message[];
  isLoading: boolean;
  activeAssistant: AssistantType;
  isNearingContextLimit: boolean;
  sendMessage: (content: string) => Promise<void>;
  clearChat: () => void;
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
      const newAssistantType = await determineAssistantType(content);
      
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
      
      // Load relevant data for the query
      const relevantData = await loadRelevantData(content);
      
      // Get appropriate system prompt
      const systemPrompt = getSystemPrompt(newAssistantType, relevantData);
      
      // Use the enhanced Anthropic service with context management
      const response = await contextEnhancedAnthropicService.sendMessage(
        updatedMessages,
        {
          system: systemPrompt,
          activeAssistant: newAssistantType,
          preserveHistory: true,
          trackTokenUsage: true
        }
      );
      
      // Add assistant response to state
      const assistantMessage: Message = {
        id: generateId(),
        content: response.content,
        role: 'assistant',
        timestamp: new Date(),
        assistantType: newAssistantType,
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
      console.error('Error sending message:', error);
      
      // Add error message
      const errorMessage: Message = {
        id: generateId(),
        content: 'Sorry, there was an error processing your request. Please try again.',
        role: 'system',
        timestamp: new Date(),
      };
      
      setMessages(prevMessages => [...prevMessages, errorMessage]);
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
        clearChat 
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