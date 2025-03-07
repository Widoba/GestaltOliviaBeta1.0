import React, { useState, FormEvent, useRef, useEffect } from 'react';
import { useChat } from '../contexts/ChatContext';

const MessageInput: React.FC = () => {
  const [message, setMessage] = useState('');
  const { sendMessage, isLoading, activeAssistant } = useChat();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  // Suggested quick replies based on assistant type
  const quickReplies = {
    unified: [
      'What tasks do I have this week?',
      'Tell me about our hiring progress'
    ],
    employee: [
      'Show me my team\'s schedule',
      'How do I submit time off?',
      'Show me pending performance reviews'
    ],
    talent: [
      'Show me open job requisitions',
      'How many candidates are in the pipeline?',
      'Schedule an interview with candidate'
    ]
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      sendMessage(message);
      setMessage('');
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

  return (
    <div className="border-t bg-white p-4">
      {!isLoading && quickReplies[activeAssistant] && (
        <div className="mb-3 flex flex-wrap gap-2">
          {quickReplies[activeAssistant].map((reply, index) => (
            <button
              key={index}
              onClick={() => sendMessage(reply)}
              className="px-3 py-1.5 text-sm bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
            >
              {reply}
            </button>
          ))}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="flex gap-2">
        <textarea
          ref={inputRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          className="chat-input resize-none overflow-hidden min-h-[44px] max-h-[120px]"
          rows={1}
          disabled={isLoading}
        />
        <button
          type="submit"
          className="send-button flex-shrink-0"
          disabled={isLoading || !message.trim()}
        >
          {isLoading ? (
            <div className="loading-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          ) : (
            'Send'
          )}
        </button>
      </form>
    </div>
  );
};

export default MessageInput;