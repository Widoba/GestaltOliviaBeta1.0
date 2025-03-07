import React from 'react';
import BaseCard from './BaseCard';
import { AssistantType } from '../../contexts/ChatContext';
import { useChat } from '../../contexts/ChatContext';

export interface CandidateCardProps {
  candidate: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    jobId: string;
    stage: string;
    applicationDate: string;
    status: string;
    skills?: string[];
    experience?: string;
    education?: string;
    interviewFeedback?: any[];
    notes?: string;
  };
  jobTitle?: string;
  assistantType: AssistantType;
  showActions?: boolean;
}

/**
 * Card for displaying candidate information
 */
const CandidateCard: React.FC<CandidateCardProps> = ({
  candidate,
  jobTitle,
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

  // Handle scheduling an interview
  const handleScheduleInterview = () => {
    // This would typically show a date picker modal
    // For simplicity, we'll schedule it for tomorrow at 10am
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    
    completeAction('scheduleInterview', {
      candidateId: candidate.id,
      date: tomorrow.toISOString(),
      interviewerId: 'E2001', // Default interviewer ID
      location: 'Video call',
      notes: 'Interview scheduled via chat interface',
    });
  };

  // Get stage badge color
  const getStageBadgeStyle = () => {
    switch (candidate.stage) {
      case 'application':
        return 'bg-blue-100 text-blue-800';
      case 'screening':
        return 'bg-indigo-100 text-indigo-800';
      case 'interview':
        return 'bg-purple-100 text-purple-800';
      case 'offer':
        return 'bg-green-100 text-green-800';
      case 'hired':
        return 'bg-emerald-100 text-emerald-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Determine if we should show the schedule interview button
  const canScheduleInterview = candidate.stage === 'screening' || candidate.stage === 'interview';

  return (
    <BaseCard
      title={`${candidate.firstName} ${candidate.lastName}`}
      assistantType={assistantType}
      icon={
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
        </svg>
      }
      actions={
        showActions && canScheduleInterview ? (
          <button
            onClick={handleScheduleInterview}
            className="text-xs bg-amber-100 hover:bg-amber-200 text-amber-800 px-2 py-1 rounded transition-colors"
          >
            Schedule Interview
          </button>
        ) : undefined
      }
      footer={
        <div className="flex justify-between">
          <span>Applied: {formatDate(candidate.applicationDate)}</span>
          <span>{jobTitle || `Job ID: ${candidate.jobId}`}</span>
        </div>
      }
    >
      <div className="space-y-3">
        <div className="flex space-x-2">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStageBadgeStyle()}`}>
            {candidate.stage}
          </span>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            candidate.status === 'active' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-100 text-gray-800'
          }`}>
            {candidate.status}
          </span>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-sm text-gray-500">Email</div>
            <div className="font-medium text-blue-600 truncate">{candidate.email}</div>
          </div>
          
          <div>
            <div className="text-sm text-gray-500">Phone</div>
            <div className="font-medium">{candidate.phone}</div>
          </div>
        </div>
        
        {candidate.skills && candidate.skills.length > 0 && (
          <div>
            <div className="text-sm text-gray-500">Skills</div>
            <div className="flex flex-wrap gap-1 mt-1">
              {candidate.skills.map((skill, index) => (
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
        
        {candidate.experience && (
          <div>
            <div className="text-sm text-gray-500">Experience</div>
            <div className="text-sm">{candidate.experience}</div>
          </div>
        )}
        
        {candidate.education && (
          <div>
            <div className="text-sm text-gray-500">Education</div>
            <div className="text-sm">{candidate.education}</div>
          </div>
        )}
        
        {candidate.notes && (
          <div>
            <div className="text-sm text-gray-500">Notes</div>
            <div className="text-sm">{candidate.notes}</div>
          </div>
        )}
      </div>
    </BaseCard>
  );
};

export default CandidateCard;