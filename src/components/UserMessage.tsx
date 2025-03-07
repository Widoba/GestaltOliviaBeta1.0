import React from 'react';
import { Message } from '../contexts/ChatContext';

interface UserMessageProps {
  message: Message;
}

const UserMessage: React.FC<UserMessageProps> = ({ message }) => {
  return (
    <div className="flex w-full mb-4 justify-end">
      <div className="max-w-[80%] p-4 rounded-lg shadow-sm user-message border">
        <div className="flex items-center mb-2">
          <div className="font-medium">You</div>
          <div className="text-xs text-gray-500 ml-2">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
        <div className="whitespace-pre-wrap">{message.content}</div>
      </div>
    </div>
  );
};

export default UserMessage;