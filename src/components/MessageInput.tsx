import React, { useState, FormEvent, useRef, useEffect } from 'react';
import { useChat } from '../contexts/ChatContext';

const MessageInput: React.FC = () => {
  const [message, setMessage] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { sendMessage, isLoading, activeAssistant } = useChat();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  // Suggested quick replies based on assistant type
  const quickReplies = {
    unified: [
      'What tasks do I have this week?',
      'Tell me about our hiring progress',
      'Show me my team\'s schedule',
      'How many open positions do we have?'
    ],
    employee: [
      'Show me my team\'s schedule',
      'How do I submit time off?',
      'Show me pending performance reviews',
      'What tasks are due this week?',
      'Who is out of office today?'
    ],
    talent: [
      'Show me open job requisitions',
      'How many candidates are in the pipeline?',
      'Schedule an interview with candidate',
      'What\'s the status of the Software Developer position?',
      'Show me candidates for the Marketing position'
    ]
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      sendMessage(message);
      setMessage('');
      setShowSuggestions(false);
    }
  };

  // Auto-resize the textarea based on content
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
    }
  }, [message]);

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };
  
  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion);
    setShowSuggestions(false);
  };
  
  // Show suggestions when input is focused
  const handleFocus = () => {
    if (!isLoading && !message.trim()) {
      setShowSuggestions(true);
    }
  };
  
  // Hide suggestions when input is blurred, unless blurring to click a suggestion
  const handleBlur = (e: React.FocusEvent) => {
    // Check if the relatedTarget is a suggestion button
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (!relatedTarget || !relatedTarget.classList.contains('suggestion-button')) {
      setShowSuggestions(false);
    }
  };

  return (
    <div className="border-t bg-white p-4">
      {/* Quick reply buttons - always visible */}
      {!isLoading && quickReplies[activeAssistant] && (
        <div className="mb-3 flex flex-wrap gap-2">
          {quickReplies[activeAssistant].slice(0, 3).map((reply, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(reply)}
              className="px-3 py-1.5 text-sm bg-gray-100 rounded-full hover:bg-gray-200 transition-colors suggestion-button"
            >
              {reply}
            </button>
          ))}
        </div>
      )}
      
      {/* Expanded suggestions - visible on focus */}
      {showSuggestions && !isLoading && (
        <div className="mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200 transition-all duration-300 ease-in-out">
          <p className="text-sm text-gray-500 mb-2">Try asking:</p>
          <div className="grid grid-cols-1 gap-2">
            {quickReplies[activeAssistant].map((reply, index) => (
              <button
                key={`expanded-${index}`}
                onClick={() => handleSuggestionClick(reply)}
                className="text-left text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded px-2 py-1 transition-colors suggestion-button"
              >
                {reply}
              </button>
            ))}
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="flex gap-2">
        <textarea
          ref={inputRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder="Type your message..."
          className="chat-input resize-none overflow-hidden min-h-[44px] max-h-[120px]"
          rows={1}
          disabled={isLoading}
        />
        <button
          type="submit"
          className={`send-button flex-shrink-0 transition-all duration-300 ${isLoading ? 'bg-gray-400' : message.trim() ? 'bg-blue-500 hover:bg-blue-600' : 'bg-blue-300'}`}
          disabled={isLoading || !message.trim()}
        >
          {isLoading ? (
            <div className="loading-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          ) : (
            <div className="flex items-center">
              <span>Send</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </button>
      </form>
    </div>
  );
};

export default MessageInput;