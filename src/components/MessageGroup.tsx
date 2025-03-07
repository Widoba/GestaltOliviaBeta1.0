import React from 'react';
import { Message, AssistantType } from '../contexts/ChatContext';
import UserMessage from './UserMessage';
import AssistantMessage from './AssistantMessage';
import SystemMessage from './SystemMessage';
import SystemMessageTransition from './SystemMessageTransition';

interface MessageGroupProps {
  messages: Message[];
  previousMessage: Message | null;
}

/**
 * MessageGroup component for grouping related messages together
 * and handling transitions between different assistant types
 */
const MessageGroup: React.FC<MessageGroupProps> = ({ messages, previousMessage }) => {
  if (!messages || messages.length === 0) return null;
  
  // Get previous assistant type if available
  const getPreviousAssistantType = (): AssistantType => {
    if (previousMessage && previousMessage.role === 'assistant' && previousMessage.assistantType) {
      return previousMessage.assistantType;
    }
    return 'unified';
  };
  
  // Render the appropriate message component based on message role and context
  const renderMessage = (message: Message, index: number) => {
    // Handle system messages that indicate assistant transitions
    if (message.role === 'system' && message.content.includes('Switching to')) {
      const newAssistantType = message.content.includes('Employee Assistant') 
        ? 'employee' 
        : message.content.includes('Talent Acquisition') 
          ? 'talent' 
          : 'unified';
      
      return (
        <SystemMessageTransition 
          key={message.id}
          message={message}
          previousAssistant={getPreviousAssistantType()}
          newAssistant={newAssistantType}
        />
      );
    }
    
    // Render regular messages based on role
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
  
  // Determine if this group should have a visual separator
  const needsSeparator = () => {
    if (!previousMessage) return false;
    
    // Add separator for assistant transitions or time gaps
    if (previousMessage.role === 'assistant' && messages[0].role === 'assistant') {
      // Check if assistant type changed
      if (
        previousMessage.assistantType && 
        messages[0].assistantType && 
        previousMessage.assistantType !== messages[0].assistantType
      ) {
        return true;
      }
      
      // Check if there's a big time gap (more than 2 minutes)
      const prevTime = new Date(previousMessage.timestamp).getTime();
      const currTime = new Date(messages[0].timestamp).getTime();
      if ((currTime - prevTime) > 2 * 60 * 1000) {
        return true;
      }
    }
    
    return false;
  };
  
  return (
    <div className="message-group">
      {needsSeparator() && (
        <div className="my-4 border-t border-gray-200"></div>
      )}
      
      <div className="space-y-2">
        {messages.map((message, index) => renderMessage(message, index))}
      </div>
    </div>
  );
};

export default MessageGroup;