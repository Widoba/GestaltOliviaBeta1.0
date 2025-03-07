import React, { useState, useEffect } from 'react';
import { Message } from '../contexts/ChatContext';

interface SystemMessageProps {
  message: Message;
}

const SystemMessage: React.FC<SystemMessageProps> = ({ message }) => {
  const [isVisible, setIsVisible] = useState(false);
  
  // Determine message type to apply different styling
  const isWarning = message.content.includes('context') || message.content.includes('limit');
  const isError = message.content.includes('error') || message.content.includes('failed');
  const isInfo = message.content.includes('Note:') || message.content.includes('Tip:');
  
  // Get appropriate styling based on message type
  const getMessageStyle = () => {
    if (isWarning) {
      return 'bg-yellow-50 border-yellow-200 text-yellow-700';
    } else if (isError) {
      return 'bg-red-50 border-red-200 text-red-700';
    } else if (isInfo) {
      return 'bg-blue-50 border-blue-200 text-blue-700';
    } else {
      return 'bg-gray-50 border-gray-200 text-gray-600';
    }
  };
  
  // Animation effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div className={`flex w-full mb-3 justify-center transition-all duration-300 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}>
      <div className={`max-w-[80%] py-2 px-4 rounded-lg border ${getMessageStyle()} text-center`}>
        <div className="whitespace-pre-wrap">{message.content}</div>
      </div>
    </div>
  );
};

export default SystemMessage;