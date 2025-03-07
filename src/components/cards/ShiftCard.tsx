import React from 'react';
import BaseCard from './BaseCard';
import { AssistantType } from '../../contexts/ChatContext';
import { useChat } from '../../contexts/ChatContext';

export interface ShiftCardProps {
  shift: {
    id: string;
    employeeId: string;
    startDate: string;
    endDate: string;
    schedule: {
      day: string;
      startTime: string;
      endTime: string;
      breakTime: string;
    }[];
    type: string;
    status: string;
    location: string;
  };
  employeeName?: string;
  assistantType: AssistantType;
  showActions?: boolean;
  isSwapRequest?: boolean;
}

/**
 * Card for displaying shift information
 */
const ShiftCard: React.FC<ShiftCardProps> = ({
  shift,
  employeeName,
  assistantType,
  showActions = true,
  isSwapRequest = false,
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

  // Format time for display (24-hour to 12-hour)
  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  // Handle approving a shift swap
  const handleApproveShiftSwap = () => {
    completeAction('approveShiftSwap', {
      taskId: `SM${shift.id.slice(1)}`, // Create a task ID based on shift ID
      approved: true,
      notes: 'Approved via chat interface',
    });
  };

  // Handle denying a shift swap
  const handleDenyShiftSwap = () => {
    completeAction('approveShiftSwap', {
      taskId: `SM${shift.id.slice(1)}`, // Create a task ID based on shift ID
      approved: false,
      notes: 'Denied via chat interface',
    });
  };

  // Get status badge color
  const getStatusBadgeStyle = () => {
    switch (shift.status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'swap_requested':
        return 'bg-blue-100 text-blue-800';
      case 'canceled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get day of week abbreviation
  const getDayAbbreviation = (day: string) => {
    const days: Record<string, string> = {
      'monday': 'Mon',
      'tuesday': 'Tue',
      'wednesday': 'Wed',
      'thursday': 'Thu',
      'friday': 'Fri',
      'saturday': 'Sat',
      'sunday': 'Sun',
    };
    return days[day.toLowerCase()] || day.substring(0, 3);
  };

  return (
    <BaseCard
      title={`${employeeName ? `${employeeName}'s Shift` : 'Shift'}`}
      assistantType={assistantType}
      icon={
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
        </svg>
      }
      actions={
        showActions && isSwapRequest ? (
          <div className="flex space-x-2">
            <button
              onClick={handleApproveShiftSwap}
              className="text-xs bg-green-100 hover:bg-green-200 text-green-800 px-2 py-1 rounded transition-colors"
            >
              Approve
            </button>
            <button
              onClick={handleDenyShiftSwap}
              className="text-xs bg-red-100 hover:bg-red-200 text-red-800 px-2 py-1 rounded transition-colors"
            >
              Deny
            </button>
          </div>
        ) : undefined
      }
      footer={
        <div className="flex justify-between">
          <span>Location: {shift.location}</span>
          <span>Type: {shift.type}</span>
        </div>
      }
    >
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeStyle()}`}>
              {shift.status.replace('_', ' ')}
            </span>
          </div>
          <div className="text-sm text-gray-500">
            {formatDate(shift.startDate)} - {formatDate(shift.endDate)}
          </div>
        </div>
        
        <div className="border rounded overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Day</th>
                <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Start</th>
                <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">End</th>
                <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Break</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {shift.schedule.map((day, index) => (
                <tr key={index}>
                  <td className="px-4 py-2 text-sm">{getDayAbbreviation(day.day)}</td>
                  <td className="px-4 py-2 text-sm">{formatTime(day.startTime)}</td>
                  <td className="px-4 py-2 text-sm">{formatTime(day.endTime)}</td>
                  <td className="px-4 py-2 text-sm">{day.breakTime}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {isSwapRequest && (
          <div className="bg-blue-50 p-3 rounded border border-blue-100 text-sm text-blue-800">
            This shift has a swap request that needs your approval.
          </div>
        )}
      </div>
    </BaseCard>
  );
};

export default ShiftCard;