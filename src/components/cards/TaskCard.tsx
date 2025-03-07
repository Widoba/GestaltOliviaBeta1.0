import React from 'react';
import BaseCard from './BaseCard';
import { AssistantType } from '../../contexts/ChatContext';
import { useChat } from '../../contexts/ChatContext';

export interface TaskCardProps {
  task: {
    id: string;
    taskType: string;
    title: string;
    description: string;
    status: string;
    dueDate: string;
    priority: string;
    employeeId?: string;
    assignedBy?: string;
    assignedDate?: string;
    notes?: string;
    completedDate?: string;
  };
  assistantType: AssistantType;
  showActions?: boolean;
}

/**
 * Card for displaying task information with action buttons
 */
const TaskCard: React.FC<TaskCardProps> = ({
  task,
  assistantType,
  showActions = true,
}) => {
  const { completeAction } = useChat();

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  // Check if the task is due soon (within 2 days)
  const isDueSoon = () => {
    const dueDate = new Date(task.dueDate);
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = diffTime / (1000 * 3600 * 24);
    return diffDays > 0 && diffDays <= 2;
  };

  // Check if the task is overdue
  const isOverdue = () => {
    const dueDate = new Date(task.dueDate);
    const today = new Date();
    return dueDate < today && task.status !== 'completed';
  };

  // Handle completing a task
  const handleComplete = () => {
    completeAction('completeTask', {
      taskId: task.id,
      notes: 'Completed via chat interface',
    });
  };

  // Determine the status badge style
  const getStatusBadgeStyle = () => {
    if (task.status === 'completed') {
      return 'bg-green-100 text-green-800';
    } else if (isOverdue()) {
      return 'bg-red-100 text-red-800';
    } else if (isDueSoon()) {
      return 'bg-yellow-100 text-yellow-800';
    } else {
      return 'bg-blue-100 text-blue-800';
    }
  };

  // Determine the priority badge style
  const getPriorityBadgeStyle = () => {
    switch (task.priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <BaseCard
      title={task.title}
      assistantType={assistantType}
      icon={
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
          <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
        </svg>
      }
      actions={
        showActions && task.status !== 'completed' ? (
          <button
            onClick={handleComplete}
            className="text-xs bg-green-100 hover:bg-green-200 text-green-800 px-2 py-1 rounded transition-colors"
          >
            Complete
          </button>
        ) : undefined
      }
      footer={
        <div className="flex justify-between">
          <span>Due: {formatDate(task.dueDate)}</span>
          <span>Type: {task.taskType}</span>
        </div>
      }
    >
      <div className="space-y-3">
        <div className="flex space-x-2">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeStyle()}`}>
            {isOverdue() && task.status !== 'completed' ? 'Overdue' : task.status}
          </span>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityBadgeStyle()}`}>
            {task.priority} priority
          </span>
        </div>
        
        <div>
          <div className="text-sm text-gray-500">Description</div>
          <div className="text-sm">{task.description}</div>
        </div>
        
        {task.notes && (
          <div>
            <div className="text-sm text-gray-500">Notes</div>
            <div className="text-sm">{task.notes}</div>
          </div>
        )}
        
        {task.completedDate && (
          <div>
            <div className="text-sm text-gray-500">Completed</div>
            <div className="text-sm">{formatDate(task.completedDate)}</div>
          </div>
        )}
      </div>
    </BaseCard>
  );
};

export default TaskCard;