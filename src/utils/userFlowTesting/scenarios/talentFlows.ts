/**
 * Talent Acquisition Test Scenarios
 * 
 * Test flows for recruitment, candidates, job postings, and hiring
 */

import { TestFlow } from '../types';

/**
 * Candidate Management Flow
 * Tests the assistant's ability to handle candidate-related queries
 */
export const candidateManagementFlow: TestFlow = {
  id: 'candidate-management-flow',
  name: 'Candidate Management',
  description: 'Tests the assistant\'s ability to handle candidate queries and updates',
  category: 'talent',
  tags: ['candidates', 'happy-path'],
  steps: [
    // View all candidates
    {
      message: "Show me all candidates for the Senior Sales Associate position",
      expectedAssistantType: 'talent',
      expectedIntent: 'candidate_management',
      expectedEntities: ['job'],
      expectedFunctionCalls: ['getCandidatesByJobReqId'],
      dataValidation: [
        {
          type: 'entityPresent',
          target: 'structuredData',
          value: 'candidate',
          description: 'Response should contain candidate data'
        }
      ],
      notes: 'Should display candidates for the specified job position'
    },
    
    // View specific candidate details
    {
      message: "Tell me more about Alex Johnson's application",
      expectedAssistantType: 'talent',
      expectedIntent: 'candidate_management',
      expectedEntities: ['candidate'],
      expectedFunctionCalls: ['getCandidateById'],
      dataValidation: [
        {
          type: 'contains',
          target: 'text',
          value: 'Alex Johnson',
          description: 'Response should mention the candidate name'
        }
      ],
      notes: 'Should display detailed information about a specific candidate'
    },
    
    // Update candidate status
    {
      message: "Move Alex Johnson to the interview stage",
      expectedAssistantType: 'talent',
      expectedIntent: 'candidate_management',
      expectedEntities: ['candidate'],
      expectedFunctionCalls: ['updateCandidateStatus'],
      notes: 'Should update a candidate\'s journey status'
    },
    
    // Add notes to candidate
    {
      message: "Add a note to Alex Johnson's profile: Great communication skills, follow up for second interview",
      expectedAssistantType: 'talent',
      expectedIntent: 'candidate_management',
      expectedEntities: ['candidate'],
      expectedFunctionCalls: ['addCandidateNote'],
      notes: 'Should add a manager note to a candidate profile'
    }
  ]
};

/**
 * Job Posting Management Flow
 * Tests the assistant's ability to handle job posting queries and updates
 */
export const jobPostingFlow: TestFlow = {
  id: 'job-posting-flow',
  name: 'Job Posting Management',
  description: 'Tests the assistant\'s ability to handle job posting queries and updates',
  category: 'talent',
  tags: ['jobs', 'happy-path'],
  steps: [
    // View active job postings
    {
      message: "Show me all active job postings for my team",
      expectedAssistantType: 'talent',
      expectedIntent: 'job_management',
      expectedFunctionCalls: ['getActiveJobPostings'],
      dataValidation: [
        {
          type: 'entityPresent',
          target: 'structuredData',
          value: 'job',
          description: 'Response should contain job data'
        }
      ],
      notes: 'Should display active job postings for the manager\'s team'
    },
    
    // View specific job details
    {
      message: "Give me details about the Senior Sales Associate position in Chicago",
      expectedAssistantType: 'talent',
      expectedIntent: 'job_management',
      expectedEntities: ['job', 'location'],
      expectedFunctionCalls: ['getJobDetails'],
      notes: 'Should display detailed information about a specific job posting'
    },
    
    // Check job application status
    {
      message: "How many applications have we received for the Senior Sales Associate position?",
      expectedAssistantType: 'talent',
      expectedIntent: 'job_management',
      expectedEntities: ['job'],
      expectedFunctionCalls: ['getJobApplicationCount'],
      notes: 'Should provide application statistics for a specific job'
    },
    
    // Update job status
    {
      message: "Close the Junior Cashier position as we've filled it",
      expectedAssistantType: 'talent',
      expectedIntent: 'job_management',
      expectedEntities: ['job'],
      expectedFunctionCalls: ['updateJobStatus'],
      notes: 'Should update the status of a job posting'
    }
  ]
};

/**
 * Interview Process Flow
 * Tests the assistant's ability to handle interview scheduling and feedback
 */
export const interviewProcessFlow: TestFlow = {
  id: 'interview-process-flow',
  name: 'Interview Process',
  description: 'Tests the assistant\'s ability to handle interview scheduling and feedback',
  category: 'talent',
  tags: ['interviews', 'happy-path'],
  steps: [
    // View interview schedule
    {
      message: "What interviews do I have scheduled this week?",
      expectedAssistantType: 'talent',
      expectedIntent: 'interview_process',
      expectedEntities: ['time_period'],
      expectedFunctionCalls: ['getInterviewSchedule'],
      dataValidation: [
        {
          type: 'entityPresent',
          target: 'structuredData',
          value: 'candidate',
          description: 'Response should contain candidate interview data'
        }
      ],
      notes: 'Should display upcoming interview schedule'
    },
    
    // Schedule interview
    {
      message: "Schedule an interview with Alex Johnson for the Senior Sales Associate position next Tuesday at 2 PM",
      expectedAssistantType: 'talent',
      expectedIntent: 'interview_process',
      expectedEntities: ['candidate', 'job', 'date', 'time_period'],
      expectedFunctionCalls: ['scheduleInterview'],
      notes: 'Should schedule an interview with specified details'
    },
    
    // Reschedule interview
    {
      message: "I need to reschedule Alex Johnson's interview to Wednesday at 3 PM",
      expectedAssistantType: 'talent',
      expectedIntent: 'interview_process',
      expectedEntities: ['candidate', 'date', 'time_period'],
      expectedFunctionCalls: ['rescheduleInterview'],
      notes: 'Should update an existing interview schedule'
    },
    
    // Submit interview feedback
    {
      message: "Submit feedback for Alex Johnson's interview: Strong candidate with retail experience, recommend moving forward to the next stage",
      expectedAssistantType: 'talent',
      expectedIntent: 'interview_process',
      expectedEntities: ['candidate'],
      expectedFunctionCalls: ['submitInterviewFeedback'],
      notes: 'Should record feedback for a candidate interview'
    }
  ]
};

/**
 * Hiring Workflow Flow
 * Tests the assistant's ability to handle the hiring process
 */
export const hiringWorkflowFlow: TestFlow = {
  id: 'hiring-workflow-flow',
  name: 'Hiring Workflow',
  description: 'Tests the assistant\'s ability to handle the hiring process from offer to onboarding',
  category: 'talent',
  tags: ['hiring', 'happy-path'],
  steps: [
    // Initiate offer
    {
      message: "Start the offer process for Alex Johnson for the Senior Sales Associate position",
      expectedAssistantType: 'talent',
      expectedIntent: 'hiring_workflow',
      expectedEntities: ['candidate', 'job'],
      expectedFunctionCalls: ['initiateOfferProcess'],
      notes: 'Should initiate the offer process for a candidate'
    },
    
    // Check offer status
    {
      message: "What's the status of Alex Johnson's offer?",
      expectedAssistantType: 'talent',
      expectedIntent: 'hiring_workflow',
      expectedEntities: ['candidate'],
      expectedFunctionCalls: ['getOfferStatus'],
      notes: 'Should retrieve and display the current status of an offer'
    },
    
    // Update offer details
    {
      message: "Update Alex Johnson's starting salary to $55,000",
      expectedAssistantType: 'talent',
      expectedIntent: 'hiring_workflow',
      expectedEntities: ['candidate'],
      expectedFunctionCalls: ['updateOfferDetails'],
      notes: 'Should update specific details of a pending offer'
    },
    
    // Set start date
    {
      message: "Schedule Alex Johnson to start on March 15th",
      expectedAssistantType: 'talent',
      expectedIntent: 'hiring_workflow',
      expectedEntities: ['candidate', 'date'],
      expectedFunctionCalls: ['setStartDate'],
      notes: 'Should set the start date for a new hire'
    }
  ]
};

/**
 * Talent Error Handling Flow
 * Tests how the assistant handles errors in talent-related scenarios
 */
export const talentErrorFlow: TestFlow = {
  id: 'talent-error-flow',
  name: 'Talent Error Handling',
  description: 'Tests the assistant\'s ability to handle errors in talent-related scenarios',
  category: 'error',
  tags: ['error', 'talent'],
  steps: [
    // Non-existent candidate
    {
      message: "Show me details for Taylor Swift's application",
      expectedAssistantType: 'talent',
      expectedIntent: 'candidate_management',
      expectedEntities: ['candidate'],
      notes: 'Should handle a query about a non-existent candidate gracefully'
    },
    
    // Insufficient permissions
    {
      message: "Delete all rejected applications for the Senior Sales Associate position",
      expectedAssistantType: 'talent',
      expectedIntent: 'candidate_management',
      expectedEntities: ['job'],
      notes: 'Should handle a request requiring special permissions gracefully'
    },
    
    // Missing required information
    {
      message: "Schedule an interview with Alex Johnson",
      expectedAssistantType: 'talent',
      expectedIntent: 'interview_process',
      expectedEntities: ['candidate'],
      notes: 'Should prompt for additional required information (date, time)'
    },
    
    // Invalid status change
    {
      message: "Move Alex Johnson directly from application to hired",
      expectedAssistantType: 'talent',
      expectedIntent: 'hiring_workflow',
      expectedEntities: ['candidate'],
      notes: 'Should handle an invalid workflow state transition gracefully'
    }
  ]
};

// Export all talent flows
export const talentFlows: TestFlow[] = [
  candidateManagementFlow,
  jobPostingFlow,
  interviewProcessFlow,
  hiringWorkflowFlow,
  talentErrorFlow
];