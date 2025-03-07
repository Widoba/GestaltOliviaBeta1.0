import React, { useEffect, useState } from 'react';
import { Message, AssistantType } from '../contexts/ChatContext';
import AssistantAvatar from './AssistantAvatar';

interface SystemMessageTransitionProps {
  message: Message;
  previousAssistant: AssistantType;
  newAssistant: AssistantType;
}

const SystemMessageTransition: React.FC<SystemMessageTransitionProps> = ({
  message,
  previousAssistant,
  newAssistant
}) => {
  const [showAnimation, setShowAnimation] = useState(false);
  
  useEffect(() => {
    // Trigger animation after component mount
    const timer = setTimeout(() => {
      setShowAnimation(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div className="flex w-full my-3 justify-center">
      <div className="flex items-center max-w-md bg-yellow-50 px-3 py-2 rounded-full border border-yellow-200 transition-all duration-500 ease-in-out">
        <div className={`flex transition-all duration-500 ease-in-out transform ${showAnimation ? 'opacity-0 scale-75 -translate-x-8' : 'opacity-100'}`}>
          <AssistantAvatar assistantType={previousAssistant} size="sm" />
        </div>
        
        <span className="mx-2 text-gray-600 text-sm">{message.content}</span>
        
        <div className={`flex transition-all duration-500 ease-in-out transform ${showAnimation ? 'opacity-100' : 'opacity-0 scale-75 translate-x-8'}`}>
          <AssistantAvatar assistantType={newAssistant} size="sm" animation={true} />
        </div>
      </div>
    </div>
  );
};

export default SystemMessageTransition;