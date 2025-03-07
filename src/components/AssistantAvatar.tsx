import React from 'react';
import { AssistantType } from '../contexts/ChatContext';

interface AssistantAvatarProps {
  assistantType: AssistantType;
  size?: 'sm' | 'md' | 'lg';
  animation?: boolean;
}

const AssistantAvatar: React.FC<AssistantAvatarProps> = ({
  assistantType,
  size = 'md',
  animation = false
}) => {
  // Set avatar size based on the size prop
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };
  
  // Set background color based on the assistant type
  const bgColor = 
    assistantType === 'employee' ? 'bg-blue-500' :
    assistantType === 'talent' ? 'bg-purple-500' :
    'bg-gray-500';
  
  // Animation class for transitions
  const animationClass = animation ? 'animate-avatar-transition' : '';
  
  // Set icon based on the assistant type
  const getIcon = () => {
    switch (assistantType) {
      case 'employee':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
          </svg>
        );
      case 'talent':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
          </svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
          </svg>
        );
    }
  };
  
  // Get assistant name for aria-label
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
    <div 
      className={`rounded-full ${bgColor} text-white flex items-center justify-center ${sizeClasses[size]} ${animationClass} transition-all duration-500`}
      aria-label={getAssistantName()}
    >
      {getIcon()}
    </div>
  );
};

export default AssistantAvatar;