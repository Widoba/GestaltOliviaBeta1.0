import React, { ReactNode } from 'react';
import { AssistantType } from '../../contexts/ChatContext';

export interface BaseCardProps {
  title: string;
  children: ReactNode;
  assistantType: AssistantType;
  actions?: React.ReactNode;
  footer?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

/**
 * Base card component used for all structured data displays
 */
const BaseCard: React.FC<BaseCardProps> = ({
  title,
  children,
  assistantType,
  actions,
  footer,
  icon,
  className = '',
}) => {
  // Assistant color scheme
  const colorScheme = {
    unified: {
      border: 'border-purple-200',
      header: 'bg-purple-50 text-purple-900',
      headerBorder: 'border-purple-100',
      icon: 'text-purple-700',
    },
    employee: {
      border: 'border-blue-200',
      header: 'bg-blue-50 text-blue-900',
      headerBorder: 'border-blue-100',
      icon: 'text-blue-700',
    },
    talent: {
      border: 'border-amber-200',
      header: 'bg-amber-50 text-amber-900',
      headerBorder: 'border-amber-100',
      icon: 'text-amber-700',
    },
  }[assistantType];

  return (
    <div className={`rounded-lg shadow-sm border ${colorScheme.border} overflow-hidden mb-4 ${className}`}>
      {/* Card Header */}
      <div className={`flex items-center justify-between px-4 py-3 ${colorScheme.header} border-b ${colorScheme.headerBorder}`}>
        <div className="flex items-center space-x-2">
          {icon && <span className={colorScheme.icon}>{icon}</span>}
          <h3 className="font-semibold">{title}</h3>
        </div>
        {actions && <div className="flex space-x-2">{actions}</div>}
      </div>

      {/* Card Content */}
      <div className="p-4 bg-white">{children}</div>

      {/* Card Footer */}
      {footer && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 text-sm text-gray-600">
          {footer}
        </div>
      )}
    </div>
  );
};

export default BaseCard;