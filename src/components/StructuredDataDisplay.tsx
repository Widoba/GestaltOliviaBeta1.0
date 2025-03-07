import React from 'react';
import { AssistantType } from '../contexts/ChatContext';
import EmployeeCard from './cards/EmployeeCard';
import TaskCard from './cards/TaskCard';
import ShiftCard from './cards/ShiftCard';
import CandidateCard from './cards/CandidateCard';
import JobCard from './cards/JobCard';

export interface StructuredDataDisplayProps {
  data: any;
  assistantType: AssistantType;
}

/**
 * Displays structured data retrieved from function calls as appropriate cards
 */
const StructuredDataDisplay: React.FC<StructuredDataDisplayProps> = ({
  data,
  assistantType,
}) => {
  if (!data) return null;

  return (
    <div className="mt-4 space-y-4">
      {/* Action Result - Success or Error from a completed action */}
      {data.actionResult && (
        <div className={`card-animate-in p-3 rounded ${data.actionResult.success ? 'bg-green-50 border border-green-100 text-green-800' : 'bg-red-50 border border-red-100 text-red-800'}`}>
          <div className="flex items-center">
            {data.actionResult.success ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            )}
            <span className="font-medium">{data.actionResult.message}</span>
          </div>
        </div>
      )}
      
      {/* Error Message - For fallback responses */}
      {data.fallback && (
        <div className="card-animate-in p-3 rounded bg-yellow-50 border border-yellow-200 text-yellow-800">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">
              The assistant is experiencing technical difficulties. Displaying a fallback response.
            </span>
          </div>
          {data.errorCode && (
            <div className="mt-2 text-sm pl-7">
              <p>Error type: {data.errorCode}</p>
            </div>
          )}
        </div>
      )}
      
      {/* Partial Data Warning */}
      {data.partialResults && (
        <div className="card-animate-in p-3 rounded bg-blue-50 border border-blue-200 text-blue-800 mb-3">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">
              Some information is incomplete or unavailable. Showing partial results.
            </span>
          </div>
        </div>
      )}

      {/* Individual Employee */}
      {data.employee && (
        <div className="card-animate-in">
          <EmployeeCard 
            employee={data.employee} 
            assistantType={assistantType} 
          />
        </div>
      )}

      {/* Employee List */}
      {data.employees && data.employees.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-700">Employees</h3>
          <div className="card-list">
            {data.employees.map((employee: any) => (
              <div key={employee.id} className="card-animate-in mb-4">
                <EmployeeCard 
                  employee={employee} 
                  assistantType={assistantType} 
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Individual Task */}
      {data.task && (
        <div className="card-animate-in">
          <TaskCard 
            task={data.task} 
            assistantType={assistantType} 
          />
        </div>
      )}

      {/* Task List */}
      {data.tasks && data.tasks.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-700">Tasks</h3>
          <div className="card-list">
            {data.tasks.map((task: any) => (
              <div key={task.id} className="card-animate-in mb-4">
                <TaskCard 
                  task={task} 
                  assistantType={assistantType} 
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Individual Shift */}
      {data.shift && (
        <div className="card-animate-in">
          <ShiftCard 
            shift={data.shift} 
            assistantType={assistantType} 
            isSwapRequest={data.shift.status === 'swap_requested'}
          />
        </div>
      )}

      {/* Shift List */}
      {data.shifts && data.shifts.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-700">Shifts</h3>
          <div className="card-list">
            {data.shifts.map((shift: any) => (
              <div key={shift.id} className="card-animate-in mb-4">
                <ShiftCard 
                  shift={shift} 
                  assistantType={assistantType} 
                  isSwapRequest={shift.status === 'swap_requested'}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Individual Candidate */}
      {data.candidate && (
        <div className="card-animate-in">
          <CandidateCard 
            candidate={data.candidate} 
            assistantType={assistantType} 
          />
        </div>
      )}

      {/* Candidate List */}
      {data.candidates && data.candidates.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-700">Candidates</h3>
          <div className="card-list">
            {data.candidates.map((candidate: any) => (
              <div key={candidate.id} className="card-animate-in mb-4">
                <CandidateCard 
                  key={candidate.id} 
                  candidate={candidate} 
                  assistantType={assistantType} 
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Individual Job */}
      {data.job && (
        <div className="card-animate-in">
          <JobCard 
            job={data.job} 
            assistantType={assistantType} 
          />
        </div>
      )}

      {/* Job List */}
      {data.jobs && data.jobs.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-700">Jobs</h3>
          <div className="card-list">
            {data.jobs.map((job: any) => (
              <div key={job.id} className="card-animate-in mb-4">
                <JobCard 
                  job={job} 
                  assistantType={assistantType} 
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recognition List */}
      {data.recognitions && data.recognitions.length > 0 && (
        <div className="card-animate-in p-4 bg-purple-50 border border-purple-100 rounded space-y-3">
          <h3 className="text-sm font-medium text-purple-800">Recognition</h3>
          <div className="card-list">
            {data.recognitions.map((recognition: any) => (
              <div key={recognition.id} className="card-animate-in p-3 bg-white rounded shadow-sm mb-3">
                <div className="text-sm font-medium">{recognition.type} Recognition</div>
                <div className="text-sm mt-1">{recognition.description}</div>
                <div className="mt-2 flex justify-between text-xs text-gray-500">
                  <span>Date: {new Date(recognition.date).toLocaleDateString()}</span>
                  {recognition.points && <span>Points: {recognition.points}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StructuredDataDisplay;