import React from 'react';
import { Message, AssistantType } from '../contexts/ChatContext';

interface AssistantMessageProps {
  message: Message;
}

const AssistantMessage: React.FC<AssistantMessageProps> = ({ message }) => {
  const assistantType = message.assistantType || 'unified';
  
  // Determine assistant name and styling based on type
  const getAssistantInfo = (type: AssistantType) => {
    switch (type) {
      case 'employee':
        return { 
          name: 'Olivia (Employee Assistant)', 
          className: 'employee-assistant'
        };
      case 'talent':
        return { 
          name: 'Talent Acquisition Assistant', 
          className: 'talent-assistant'
        };
      default:
        return { 
          name: 'Unified Assistant', 
          className: ''
        };
    }
  };
  
  const { name, className } = getAssistantInfo(assistantType);
  
  return (
    <div className="flex w-full mb-4">
      <div className={`max-w-[80%] p-4 rounded-lg shadow-sm assistant-message border ${className}`}>
        <div className="flex items-center mb-2">
          <div className="font-medium">{name}</div>
          <div className="text-xs text-gray-500 ml-2">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
        <div className="whitespace-pre-wrap">{message.content}</div>
      </div>
    </div>
  );
};

export default AssistantMessage;