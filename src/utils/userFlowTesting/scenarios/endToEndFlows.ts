/**
 * End-to-End User Journey Test Scenarios
 * 
 * Complex test flows that simulate complete user journeys across multiple domains
 */

import { TestFlow } from '../types';

/**
 * Daily Manager Workflow Flow
 * Simulates a manager's typical daily workflow across both domains
 */
export const dailyManagerFlow: TestFlow = {
  id: 'daily-manager-flow',
  name: 'Daily Manager Workflow',
  description: 'A comprehensive flow simulating a store manager\'s daily workflow',
  category: 'end-to-end',
  tags: ['daily', 'comprehensive'],
  steps: [
    // Morning briefing
    {
      message: "Good morning. What's on my schedule for today?",
      expectedAssistantType: 'employee',
      expectedIntent: 'schedule_management',
      expectedFunctionCalls: ['getManagerSchedule'],
      notes: 'Should retrieve the manager\'s daily schedule'
    },
    
    // Check team attendance
    {
      message: "Is anyone on my team out sick today?",
      expectedAssistantType: 'employee',
      expectedIntent: 'schedule_management',
      expectedFunctionCalls: ['getTeamAvailability'],
      notes: 'Should check for team absences'
    },
    
    // Task prioritization
    {
      message: "What are my highest priority tasks for today?",
      expectedAssistantType: 'employee',
      expectedIntent: 'task_management',
      expectedFunctionCalls: ['getTasksByManagerId'],
      notes: 'Should list tasks sorted by priority'
    },
    
    // Recruitment check
    {
      message: "Do I have any candidate interviews scheduled today?",
      expectedAssistantType: 'talent',
      expectedIntent: 'interview_process',
      expectedFunctionCalls: ['getInterviewSchedule'],
      notes: 'Should transition to talent assistant and check for scheduled interviews'
    },
    
    // Candidate preparation
    {
      message: "Tell me more about the candidate I'm interviewing at 2 PM",
      expectedAssistantType: 'talent',
      expectedIntent: 'candidate_management',
      expectedFunctionCalls: ['getCandidateByInterviewTime'],
      notes: 'Should retrieve details about the specific candidate scheduled for 2 PM'
    },
    
    // Team scheduling
    {
      message: "I need to arrange coverage for the sales floor during my interview",
      expectedAssistantType: 'employee',
      expectedIntent: 'schedule_management',
      expectedFunctionCalls: ['getTeamAvailability'],
      notes: 'Should transition back to employee context for team scheduling'
    },
    
    // Task assignment
    {
      message: "Assign Devon to cover the main entrance from 2 PM to 3 PM",
      expectedAssistantType: 'employee',
      expectedIntent: 'task_management',
      expectedEntities: ['employee', 'time_period'],
      expectedFunctionCalls: ['createTask'],
      notes: 'Should create a new task assignment'
    },
    
    // Performance recognition
    {
      message: "I want to recognize Jordan for excellent customer service yesterday",
      expectedAssistantType: 'employee',
      expectedIntent: 'recognition',
      expectedEntities: ['employee'],
      expectedFunctionCalls: ['createRecognition'],
      notes: 'Should create a new recognition entry'
    },
    
    // Job posting check
    {
      message: "How many applications have we received for the open cashier position this week?",
      expectedAssistantType: 'talent',
      expectedIntent: 'job_management',
      expectedEntities: ['job', 'time_period'],
      expectedFunctionCalls: ['getJobApplicationCount'],
      notes: 'Should transition to talent assistant and check application metrics'
    },
    
    // End of day summary
    {
      message: "Summarize what I've accomplished today and what's still pending",
      expectedAssistantType: 'unified',
      notes: 'Should provide a cross-domain summary of completed and pending tasks'
    }
  ]
};

/**
 * New Hire Onboarding Journey
 * Simulates the entire journey of hiring and onboarding a new employee
 */
export const newHireJourneyFlow: TestFlow = {
  id: 'new-hire-journey-flow',
  name: 'New Hire Onboarding Journey',
  description: 'A comprehensive flow simulating the entire process from recruitment to onboarding',
  category: 'end-to-end',
  tags: ['hiring', 'onboarding'],
  steps: [
    // Initial candidate review
    {
      message: "Show me the top candidates for the Senior Sales Associate position",
      expectedAssistantType: 'talent',
      expectedIntent: 'candidate_management',
      expectedFunctionCalls: ['getCandidatesByJobReqId'],
      notes: 'Should retrieve and rank candidates for the position'
    },
    
    // Schedule interview
    {
      message: "Schedule an interview with Alex Johnson for next Tuesday at 2 PM",
      expectedAssistantType: 'talent',
      expectedIntent: 'interview_process',
      expectedEntities: ['candidate', 'date', 'time_period'],
      expectedFunctionCalls: ['scheduleInterview'],
      notes: 'Should create a new interview appointment'
    },
    
    // Check schedule conflicts
    {
      message: "Do I have any conflicts on Tuesday afternoon?",
      expectedAssistantType: 'employee',
      expectedIntent: 'schedule_management',
      expectedEntities: ['date', 'time_period'],
      expectedFunctionCalls: ['getManagerSchedule'],
      notes: 'Should transition to employee assistant to check for schedule conflicts'
    },
    
    // Team availability
    {
      message: "Who else should be involved in the interview? Show me who's available",
      expectedAssistantType: 'employee',
      expectedIntent: 'schedule_management',
      expectedFunctionCalls: ['getTeamAvailability'],
      notes: 'Should check team availability for the interview time'
    },
    
    // Add interview panel member
    {
      message: "Add Devon to the interview panel for Alex Johnson",
      expectedAssistantType: 'talent',
      expectedIntent: 'interview_process',
      expectedEntities: ['employee', 'candidate'],
      expectedFunctionCalls: ['updateInterviewPanel'],
      notes: 'Should transition back to talent context and update the interview panel'
    },
    
    // Post-interview feedback
    {
      message: "Record my feedback for Alex Johnson's interview: Excellent communication skills, great retail experience, recommend proceeding to offer",
      expectedAssistantType: 'talent',
      expectedIntent: 'interview_process',
      expectedEntities: ['candidate'],
      expectedFunctionCalls: ['submitInterviewFeedback'],
      notes: 'Should record detailed interview feedback'
    },
    
    // Initiate offer process
    {
      message: "Start the offer process for Alex Johnson at $52,000 per year",
      expectedAssistantType: 'talent',
      expectedIntent: 'hiring_workflow',
      expectedEntities: ['candidate'],
      expectedFunctionCalls: ['initiateOfferProcess'],
      notes: 'Should begin the offer process with salary details'
    },
    
    // Set start date
    {
      message: "Alex has accepted the offer. Set their start date for March 15th",
      expectedAssistantType: 'talent',
      expectedIntent: 'hiring_workflow',
      expectedEntities: ['candidate', 'date'],
      expectedFunctionCalls: ['setStartDate'],
      notes: 'Should update the candidate record with the accepted offer and start date'
    },
    
    // Prepare team for new hire
    {
      message: "Schedule a team meeting to announce Alex's hiring",
      expectedAssistantType: 'employee',
      expectedIntent: 'schedule_management',
      expectedFunctionCalls: ['scheduleTeamMeeting'],
      notes: 'Should transition to employee assistant and create a team meeting'
    },
    
    // Onboarding tasks
    {
      message: "Create an onboarding task list for Alex's first week",
      expectedAssistantType: 'employee',
      expectedIntent: 'task_management',
      expectedEntities: ['employee'],
      expectedFunctionCalls: ['createOnboardingTasks'],
      notes: 'Should generate a series of onboarding tasks for the new employee'
    }
  ]
};

/**
 * Store Performance Management Journey
 * Simulates a manager analyzing store performance and taking actions
 */
export const storePerformanceFlow: TestFlow = {
  id: 'store-performance-flow',
  name: 'Store Performance Management',
  description: 'A comprehensive flow simulating performance review and action planning',
  category: 'end-to-end',
  tags: ['performance', 'management'],
  steps: [
    // Team performance review
    {
      message: "Show me the latest performance metrics for my team",
      expectedAssistantType: 'employee',
      expectedIntent: 'employee_info',
      expectedFunctionCalls: ['getTeamPerformanceMetrics'],
      notes: 'Should retrieve and display team performance data'
    },
    
    // High performer recognition
    {
      message: "I see Devon has the highest customer satisfaction rating. Create a recognition for their excellent customer service",
      expectedAssistantType: 'employee',
      expectedIntent: 'recognition',
      expectedEntities: ['employee'],
      expectedFunctionCalls: ['createRecognition'],
      notes: 'Should create a recognition record for Devon'
    },
    
    // Performance improvement
    {
      message: "Schedule a coaching session with Jordan to discuss their sales performance",
      expectedAssistantType: 'employee',
      expectedIntent: 'schedule_management',
      expectedEntities: ['employee'],
      expectedFunctionCalls: ['scheduleCoachingSession'],
      notes: 'Should create a coaching session appointment'
    },
    
    // Staffing needs analysis
    {
      message: "Based on customer traffic, do we need additional staffing for the upcoming holiday season?",
      expectedAssistantType: 'employee',
      expectedIntent: 'schedule_management',
      expectedFunctionCalls: ['getStaffingNeeds'],
      notes: 'Should analyze staffing requirements'
    },
    
    // Create job posting
    {
      message: "Create a new job posting for Seasonal Sales Associates for the holiday period",
      expectedAssistantType: 'talent',
      expectedIntent: 'job_management',
      expectedFunctionCalls: ['createJobPosting'],
      notes: 'Should transition to talent assistant and create a new job posting'
    },
    
    // Job posting details
    {
      message: "Update the posting to mention evening and weekend availability as required",
      expectedAssistantType: 'talent',
      expectedIntent: 'job_management',
      expectedFunctionCalls: ['updateJobPosting'],
      notes: 'Should modify the job posting details'
    },
    
    // Review pending applications
    {
      message: "Show me any pending applications we already have that might fit this role",
      expectedAssistantType: 'talent',
      expectedIntent: 'candidate_management',
      expectedFunctionCalls: ['getMatchingCandidates'],
      notes: 'Should search for existing candidates matching the new requirements'
    },
    
    // Cross-training planning
    {
      message: "Create a task to develop a cross-training plan for the current team to handle increased holiday traffic",
      expectedAssistantType: 'employee',
      expectedIntent: 'task_management',
      expectedFunctionCalls: ['createTask'],
      notes: 'Should transition back to employee assistant and create a training task'
    },
    
    // Schedule adjustment
    {
      message: "Adjust our team schedule to ensure we have more coverage during peak hours",
      expectedAssistantType: 'employee',
      expectedIntent: 'schedule_management',
      expectedFunctionCalls: ['optimizeTeamSchedule'],
      notes: 'Should analyze and suggest schedule adjustments'
    },
    
    // Performance target setting
    {
      message: "Set new sales targets for each team member based on their current performance",
      expectedAssistantType: 'employee',
      expectedIntent: 'employee_info',
      expectedFunctionCalls: ['setPerformanceTargets'],
      notes: 'Should create individualized performance targets'
    }
  ]
};

// Export all end-to-end flows
export const endToEndFlows: TestFlow[] = [
  dailyManagerFlow,
  newHireJourneyFlow,
  storePerformanceFlow
];