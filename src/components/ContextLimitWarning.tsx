import React from 'react';
import { useChat } from '../contexts/ChatContext';

const ContextLimitWarning: React.FC = () => {
  const { isNearingContextLimit, clearChat } = useChat();
  
  if (!isNearingContextLimit) {
    return null;
  }
  
  return (
    <div className="bg-yellow-50 border-yellow-200 border rounded-lg p-3 mb-4 text-sm">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <p className="text-yellow-700">
            The conversation is getting long. Some older messages may be summarized to stay within limits.
          </p>
          <div className="mt-2">
            <button
              type="button"
              className="mr-2 inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-yellow-700 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
              onClick={clearChat}
            >
              Clear Chat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContextLimitWarning;