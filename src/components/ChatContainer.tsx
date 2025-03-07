import React, { useRef, useEffect } from 'react';
import { useChat, Message as ChatMessage } from '../contexts/ChatContext';
import UserMessage from './UserMessage';
import AssistantMessage from './AssistantMessage';
import SystemMessage from './SystemMessage';
import MessageInput from './MessageInput';
import ContextLimitWarning from './ContextLimitWarning';

const ChatContainer: React.FC = () => {
  const { messages, isLoading, activeAssistant, isNearingContextLimit, clearChat } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Render the appropriate message component based on message role
  const renderMessage = (message: ChatMessage) => {
    switch (message.role) {
      case 'user':
        return <UserMessage key={message.id} message={message} />;
      case 'assistant':
        return <AssistantMessage key={message.id} message={message} />;
      case 'system':
        return <SystemMessage key={message.id} message={message} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-md overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-white border-b flex justify-between items-center">
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
        <button
          onClick={clearChat}
          className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded"
        >
          Clear Chat
        </button>
      </div>
      
      {/* Messages container */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {isNearingContextLimit && <ContextLimitWarning />}
        
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400">
            <div className="text-center max-w-md">
              <h2 className="text-xl font-medium mb-2">Welcome to the Unified Assistant</h2>
              <p>
                I can help with both employee management and talent acquisition tasks.
                Just ask a question to get started.
              </p>
            </div>
          </div>
        ) : (
          messages.map(renderMessage)
        )}
        
        {/* Show typing indicator when loading */}
        {isLoading && (
          <div className="flex w-full mb-4">
            <div className="max-w-[80%] p-4 rounded-lg shadow-sm assistant-message border">
              <div className="flex items-center mb-2">
                <div className="font-medium">
                  {activeAssistant === 'employee' 
                    ? 'Olivia (Employee Assistant)' 
                    : activeAssistant === 'talent' 
                      ? 'Talent Acquisition Assistant' 
                      : 'Unified Assistant'}
                </div>
              </div>
              <div className="loading-dots py-2">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input area */}
      <MessageInput />
    </div>
  );
};

export default ChatContainer;