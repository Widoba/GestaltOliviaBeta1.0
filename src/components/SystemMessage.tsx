import React from 'react';
import { Message } from '../contexts/ChatContext';

interface SystemMessageProps {
  message: Message;
}

const SystemMessage: React.FC<SystemMessageProps> = ({ message }) => {
  return (
    <div className="flex w-full mb-3 justify-center">
      <div className="max-w-[80%] py-2 px-4 rounded-lg system-message border text-center">
        <div className="whitespace-pre-wrap text-gray-600">{message.content}</div>
      </div>
    </div>
  );
};

export default SystemMessage;