import React from 'react';
import BaseCard from './BaseCard';
import { AssistantType } from '../../contexts/ChatContext';
import { useChat } from '../../contexts/ChatContext';

export interface EmployeeCardProps {
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    department: string;
    position: string;
    manager?: string | null;
    location: string;
    workType: string;
    skills?: string[];
    status?: string;
  };
  assistantType: AssistantType;
  showActions?: boolean;
}

/**
 * Card for displaying employee information
 */
const EmployeeCard: React.FC<EmployeeCardProps> = ({
  employee,
  assistantType,
  showActions = true,
}) => {
  const { completeAction } = useChat();

  // Handle clicking the recognize button
  const handleRecognize = () => {
    // This would typically show a modal or form for recognition
    // For simplicity, we'll just call the action with some default values
    completeAction('recognizeEmployee', {
      employeeId: employee.id,
      category: 'performance',
      message: `Great job this week, ${employee.firstName}!`,
      points: 50,
    });
  };

  return (
    <BaseCard
      title={`${employee.firstName} ${employee.lastName}`}
      assistantType={assistantType}
      icon={
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
        </svg>
      }
      actions={
        showActions ? (
          <button
            onClick={handleRecognize}
            className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 px-2 py-1 rounded transition-colors"
          >
            Recognize
          </button>
        ) : undefined
      }
      footer={
        <div className="flex justify-between">
          <span>{employee.department}</span>
          <span>{employee.location}</span>
        </div>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="text-sm text-gray-500">Position</div>
          <div className="font-medium">{employee.position}</div>
        </div>
        
        <div>
          <div className="text-sm text-gray-500">Work Type</div>
          <div className="font-medium">{employee.workType}</div>
        </div>
        
        <div>
          <div className="text-sm text-gray-500">Email</div>
          <div className="font-medium text-blue-600 truncate">{employee.email}</div>
        </div>
        
        <div>
          <div className="text-sm text-gray-500">Phone</div>
          <div className="font-medium">{employee.phone}</div>
        </div>
        
        {employee.status && (
          <div className="col-span-2">
            <div className="text-sm text-gray-500">Status</div>
            <div className="font-medium">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                employee.status === 'active' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {employee.status}
              </span>
            </div>
          </div>
        )}
        
        {employee.skills && employee.skills.length > 0 && (
          <div className="col-span-2">
            <div className="text-sm text-gray-500">Skills</div>
            <div className="flex flex-wrap gap-1 mt-1">
              {employee.skills.map((skill, index) => (
                <span 
                  key={index}
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </BaseCard>
  );
};

export default EmployeeCard;