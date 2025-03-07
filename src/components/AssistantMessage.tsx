import React, { useState, useEffect, useRef } from 'react';
import { Message, AssistantType } from '../contexts/ChatContext';
import AssistantAvatar from './AssistantAvatar';
import StructuredDataDisplay from './StructuredDataDisplay';

interface AssistantMessageProps {
  message: Message;
}

const AssistantMessage: React.FC<AssistantMessageProps> = ({ message }) => {
  const assistantType = message.assistantType || 'unified';
  const [isVisible, setIsVisible] = useState(false);
  const [isTyping, setIsTyping] = useState(true);
  const [displayedContent, setDisplayedContent] = useState('');
  const [showStructuredData, setShowStructuredData] = useState(false);
  const contentRef = useRef(message.content);
  const messageRef = useRef<HTMLDivElement>(null);
  
  // Determine assistant name and styling based on type
  const getAssistantInfo = (type: AssistantType) => {
    switch (type) {
      case 'employee':
        return { 
          name: 'Olivia (Employee Assistant)', 
          className: 'bg-blue-50 border-blue-200 text-blue-900'
        };
      case 'talent':
        return { 
          name: 'Talent Acquisition Assistant', 
          className: 'bg-amber-50 border-amber-200 text-amber-900'
        };
      default:
        return { 
          name: 'Unified Assistant', 
          className: 'bg-purple-50 border-purple-200 text-purple-900'
        };
    }
  };
  
  const { name, className } = getAssistantInfo(assistantType);
  
  // Simulate typing effect
  useEffect(() => {
    // Update content ref when message changes
    contentRef.current = message.content;
    
    // Fade in animation
    setIsVisible(true);
    
    // Short messages display faster
    const typingSpeed = message.content.length > 500 ? 10 : message.content.length > 200 ? 20 : 30;
    let currentPos = 0;
    
    const typingInterval = setInterval(() => {
      if (currentPos < contentRef.current.length) {
        // Add more characters at once for faster typing simulation
        const nextChunk = Math.min(currentPos + typingSpeed, contentRef.current.length);
        setDisplayedContent(contentRef.current.substring(0, nextChunk));
        currentPos = nextChunk;
      } else {
        setIsTyping(false);
        clearInterval(typingInterval);
        // Show structured data after typing is complete
        setShowStructuredData(true);
      }
    }, 50);
    
    return () => clearInterval(typingInterval);
  }, [message.content]);
  
  // Determine if there's structured data to display
  const hasStructuredData = message.structuredData && 
    Object.keys(message.structuredData).length > 0;
  
  return (
    <div className={`flex w-full mb-4 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`} ref={messageRef}>
      <div className="flex-shrink-0 mt-1 mr-2">
        <AssistantAvatar assistantType={assistantType} />
      </div>
      <div className="max-w-[calc(100%-2.5rem)] w-full space-y-2">
        <div className={`p-4 rounded-lg shadow-sm assistant-message border ${className}`}>
          <div className="flex items-center mb-2">
            <div className="font-medium">{name}</div>
            <div className="text-xs text-gray-500 ml-2">
              {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
          <div className="whitespace-pre-wrap">
            {displayedContent}
            {isTyping && (
              <span className="inline-block w-2 h-4 bg-current opacity-75 ml-0.5 animate-blink"></span>
            )}
          </div>
        </div>
        
        {/* Display structured data if available */}
        {hasStructuredData && showStructuredData && (
          <div className="transition-opacity duration-500 ease-in-out" 
            style={{ opacity: showStructuredData ? 1 : 0 }}>
            <StructuredDataDisplay 
              data={message.structuredData} 
              assistantType={assistantType} 
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default AssistantMessage;