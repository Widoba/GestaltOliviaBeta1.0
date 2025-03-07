import React from 'react';
import { AssistantType } from '../contexts/ChatContext';
import AssistantAvatar from './AssistantAvatar';

interface TypingIndicatorProps {
  assistantType: AssistantType;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ assistantType }) => {
  const getAssistantName = () => {
    switch (assistantType) {
      case 'employee':
        return 'Olivia (Employee Assistant)';
      case 'talent':
        return 'Talent Acquisition Assistant';
      default:
        return 'Unified Assistant';
    }
  };
  
  return (
    <div className="flex w-full my-2 px-2">
      <div className="flex max-w-[80%] animate-pulse-soft">
        <div className="flex-shrink-0 mr-2">
          <AssistantAvatar assistantType={assistantType} size="sm" />
        </div>
        <div className="py-2 px-3 bg-white border rounded-lg shadow-sm">
          <div className="flex items-center">
            <span className="text-sm font-medium text-gray-700">{getAssistantName()}</span>
          </div>
          <div className="mt-1">
            <div className="loading-dots" aria-label="Assistant is typing">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;