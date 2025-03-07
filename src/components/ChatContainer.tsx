import React, { useRef, useEffect, useState } from 'react';
import { useChat, Message as ChatMessage } from '../contexts/ChatContext';
import UserMessage from './UserMessage';
import AssistantMessage from './AssistantMessage';
import SystemMessage from './SystemMessage';
import MessageInput from './MessageInput';
import TypingIndicator from './TypingIndicator';
import ContextLimitWarning from './ContextLimitWarning';
import MessageGroup from './MessageGroup';
import FeedbackToast, { FeedbackType } from './FeedbackToast';
import AssistantAvatar from './AssistantAvatar';
import ErrorBoundary from './ErrorBoundary';

interface Feedback {
  message: string;
  type: FeedbackType;
}

const ChatContainer: React.FC = () => {
  const { messages, isLoading, activeAssistant, isNearingContextLimit, clearChat } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  
  // Auto-scroll to bottom when messages change or loading state changes
  useEffect(() => {
    const scrollToBottom = () => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    };
    
    // Slight delay to ensure DOM updates are complete
    const timeoutId = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timeoutId);
  }, [messages, isLoading]);
  
  // Show feedback when context limit is approached
  useEffect(() => {
    if (isNearingContextLimit) {
      setFeedback({
        message: "The conversation is getting long. Some older messages may be summarized.",
        type: "warning"
      });
    }
  }, [isNearingContextLimit]);
  
  // Handle feedback toast closing
  const handleFeedbackClose = () => {
    setFeedback(null);
  };
  
  // Group messages for better visual organization
  const groupMessages = (messages: ChatMessage[]) => {
    if (messages.length === 0) return [];
    
    // Initialize with first message
    const groups: ChatMessage[][] = [[messages[0]]];
    let currentGroupIndex = 0;
    
    // Group subsequent messages
    for (let i = 1; i < messages.length; i++) {
      const currentMessage = messages[i];
      const previousMessage = messages[i - 1];
      
      // Start a new group if:
      // 1. Role changes from user to assistant or vice versa
      // 2. System message indicates assistant transition
      // 3. There's a time gap > 2 minutes between messages
      if (
        currentMessage.role !== previousMessage.role ||
        (currentMessage.role === 'system' && currentMessage.content.includes('Switching to')) ||
        (currentMessage.role === 'assistant' && previousMessage.role === 'assistant' && 
         currentMessage.assistantType !== previousMessage.assistantType) ||
        (new Date(currentMessage.timestamp).getTime() - new Date(previousMessage.timestamp).getTime() > 2 * 60 * 1000)
      ) {
        groups.push([currentMessage]);
        currentGroupIndex++;
      } else {
        // Add to current group
        groups[currentGroupIndex].push(currentMessage);
      }
    }
    
    return groups;
  };
  
  // Create message groups
  const messageGroups = groupMessages(messages);
  
  return (
    <ErrorBoundary>
      <div className="flex flex-col h-full bg-white rounded-lg shadow-md overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-white border-b flex justify-between items-center">
          <div className="flex items-center">
            <div className="mr-3">
              <AssistantAvatar assistantType={activeAssistant} size="md" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">Unified Assistant</h1>
              <p className="text-sm text-gray-500">
                {activeAssistant === 'employee' 
                  ? 'Employee Assistant Mode' 
                  : activeAssistant === 'talent' 
                    ? 'Talent Acquisition Mode' 
                    : 'Unified Mode'}
              </p>
            </div>
          </div>
          <button
            onClick={clearChat}
            className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded transition-colors duration-200"
          >
            Clear Chat
          </button>
        </div>
        
        {/* Messages container */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50 scroll-smooth">
          <ErrorBoundary fallback={
            <div className="p-4 bg-yellow-50 rounded border border-yellow-200 mb-4">
              <p className="text-yellow-800">
                There was an error displaying the messages. Please try refreshing the page.
              </p>
              <button 
                onClick={clearChat}
                className="mt-2 px-3 py-1 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 rounded text-sm"
              >
                Clear Chat and Reset
              </button>
            </div>
          }>
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <div className="text-center max-w-md p-6 bg-white rounded-lg shadow-sm border border-gray-100">
                  <AssistantAvatar assistantType="unified" size="lg" />
                  <h2 className="text-xl font-medium my-3">Welcome to the Unified Assistant</h2>
                  <p className="text-gray-500 mb-4">
                    I can help with both employee management and talent acquisition tasks.
                    Just ask a question to get started.
                  </p>
                  <div className="text-sm text-gray-400 mt-4">
                    <p>Try asking about employee schedules, tasks, or recruitment.</p>
                  </div>
                </div>
              </div>
            ) : (
              // Render message groups
              messageGroups.map((group, groupIndex) => {
                const previousGroup = groupIndex > 0 ? messageGroups[groupIndex - 1] : null;
                const previousMessage = previousGroup ? previousGroup[previousGroup.length - 1] : null;
                
                return (
                  <MessageGroup 
                    key={`group-${groupIndex}`} 
                    messages={group} 
                    previousMessage={previousMessage}
                  />
                );
              })
            )}
          </ErrorBoundary>
          
          {/* Show typing indicator when loading */}
          {isLoading && <TypingIndicator assistantType={activeAssistant} />}
          
          <div ref={messagesEndRef} className="h-4" />
        </div>
        
        {/* Input area */}
        <ErrorBoundary fallback={
          <div className="p-4 border-t">
            <div className="bg-red-50 p-3 rounded border border-red-200 text-red-800 text-sm">
              <p>There was an error with the message input. Please refresh the page.</p>
            </div>
          </div>
        }>
          <MessageInput />
        </ErrorBoundary>
        
        {/* Feedback toast */}
        {feedback && (
          <FeedbackToast 
            message={feedback.message} 
            type={feedback.type} 
            onClose={handleFeedbackClose}
          />
        )}
      </div>
    </ErrorBoundary>
  );
};

export default ChatContainer;