import React from 'react';
import BaseCard from './BaseCard';
import { AssistantType } from '../../contexts/ChatContext';

export interface JobCardProps {
  job: {
    id: string;
    title: string;
    department: string;
    location: string;
    workType: string;
    postingDate: string;
    closingDate: string;
    status: string;
    description: string;
    requirements?: string[];
    salary?: {
      min: number;
      max: number;
      currency: string;
      commission?: string;
    };
    hiringManager?: string;
    applicationCount?: number;
    interviews?: number;
    priority?: string;
  };
  assistantType: AssistantType;
  hiringManagerName?: string;
}

/**
 * Card for displaying job information
 */
const JobCard: React.FC<JobCardProps> = ({
  job,
  assistantType,
  hiringManagerName,
}) => {
  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  // Format currency for display
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Get status badge color
  const getStatusBadgeStyle = () => {
    switch (job.status.toLowerCase()) {
      case 'active':
      case 'open':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'review':
        return 'bg-yellow-100 text-yellow-800';
      case 'closed':
        return 'bg-red-100 text-red-800';
      case 'filled':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get priority badge color
  const getPriorityBadgeStyle = () => {
    switch (job.priority?.toLowerCase()) {
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
      title={job.title}
      assistantType={assistantType}
      icon={
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
          <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z" />
        </svg>
      }
      footer={
        <div className="flex justify-between">
          <span>Department: {job.department}</span>
          <span>Location: {job.location}</span>
        </div>
      }
    >
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeStyle()}`}>
            {job.status}
          </span>
          
          {job.priority && (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityBadgeStyle()}`}>
              {job.priority} priority
            </span>
          )}
          
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {job.workType}
          </span>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-sm text-gray-500">Posted</div>
            <div className="font-medium">{formatDate(job.postingDate)}</div>
          </div>
          
          <div>
            <div className="text-sm text-gray-500">Closing</div>
            <div className="font-medium">{formatDate(job.closingDate)}</div>
          </div>
          
          {job.salary && (
            <div className="col-span-2">
              <div className="text-sm text-gray-500">Salary Range</div>
              <div className="font-medium">
                {formatCurrency(job.salary.min, job.salary.currency)} - {formatCurrency(job.salary.max, job.salary.currency)}
                {job.salary.commission && <span className="text-sm text-gray-500 ml-1">+ {job.salary.commission}</span>}
              </div>
            </div>
          )}
          
          {hiringManagerName && (
            <div className="col-span-2">
              <div className="text-sm text-gray-500">Hiring Manager</div>
              <div className="font-medium">{hiringManagerName}</div>
            </div>
          )}
          
          {job.applicationCount !== undefined && (
            <div>
              <div className="text-sm text-gray-500">Applications</div>
              <div className="font-medium">{job.applicationCount}</div>
            </div>
          )}
          
          {job.interviews !== undefined && (
            <div>
              <div className="text-sm text-gray-500">Interviews</div>
              <div className="font-medium">{job.interviews}</div>
            </div>
          )}
        </div>
        
        <div>
          <div className="text-sm text-gray-500">Description</div>
          <div className="text-sm mt-1">{job.description}</div>
        </div>
        
        {job.requirements && job.requirements.length > 0 && (
          <div>
            <div className="text-sm text-gray-500">Requirements</div>
            <ul className="text-sm mt-1 list-disc pl-5 space-y-1">
              {job.requirements.map((req, index) => (
                <li key={index}>{req}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </BaseCard>
  );
};

export default JobCard;