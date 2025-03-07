import React, { useEffect, useState } from 'react';
import { Message } from '../contexts/ChatContext';

interface UserMessageProps {
  message: Message;
}

const UserMessage: React.FC<UserMessageProps> = ({ message }) => {
  const [isVisible, setIsVisible] = useState(false);
  
  // Animation effect
  useEffect(() => {
    // Small delay before showing the message for a nice animation
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 50);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div className={`flex w-full mb-4 justify-end transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      <div className="max-w-[80%] p-4 rounded-lg shadow-sm user-message border">
        <div className="flex items-center justify-between mb-2">
          <div className="font-medium">You</div>
          <div className="text-xs text-gray-500 ml-2">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
        <div className="whitespace-pre-wrap">{message.content}</div>
      </div>
    </div>
  );
};

export default UserMessage;