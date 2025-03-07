/**
 * Assistant Transition Test Scenarios
 * 
 * Test flows for transitions between assistant types and context preservation
 */

import { TestFlow } from '../types';

/**
 * Employee to Talent Transition Flow
 * Tests the assistant's ability to transition from employee to talent context
 */
export const employeeToTalentFlow: TestFlow = {
  id: 'employee-to-talent-flow',
  name: 'Employee to Talent Transition',
  description: 'Tests transitioning from employee assistant to talent acquisition assistant',
  category: 'transition',
  tags: ['transition', 'context-preservation'],
  steps: [
    // Start with employee context
    {
      message: "What's Devon's current schedule for this week?",
      expectedAssistantType: 'employee',
      expectedIntent: 'schedule_management',
      expectedEntities: ['employee', 'time_period'],
      expectedFunctionCalls: ['getEmployeeSchedule'],
      notes: 'Should retrieve and display an employee\'s schedule'
    },
    
    // Continue in employee context
    {
      message: "Are there any task deadlines coming up for them?",
      expectedAssistantType: 'employee',
      expectedIntent: 'task_management',
      expectedEntities: ['employee'],
      expectedFunctionCalls: ['getTasksByEmployeeId'],
      notes: 'Should maintain employee context and understand "them" refers to Devon'
    },
    
    // Transition to talent context
    {
      message: "I need to check on our open job positions for the downtown store",
      expectedAssistantType: 'talent',
      expectedIntent: 'job_management',
      expectedEntities: ['location'],
      expectedFunctionCalls: ['getActiveJobPostingsByLocation'],
      notes: 'Should transition to talent assistant for job-related query'
    },
    
    // Stay in talent context
    {
      message: "How many candidates have applied for the Senior Sales Associate position?",
      expectedAssistantType: 'talent',
      expectedIntent: 'candidate_management',
      expectedEntities: ['job'],
      expectedFunctionCalls: ['getJobApplicationCount'],
      notes: 'Should maintain talent context'
    },
    
    // Explicitly reference employee info while in talent context
    {
      message: "Would Devon be a good interviewer for this position?",
      expectedAssistantType: 'talent',
      expectedIntent: 'interview_process',
      expectedEntities: ['employee'],
      dataValidation: [
        {
          type: 'contains',
          target: 'text',
          value: 'Devon',
          description: 'Response should mention Devon (from previous context)'
        }
      ],
      notes: 'Should maintain talent context but remember Devon from earlier in the conversation'
    }
  ]
};

/**
 * Talent to Employee Transition Flow
 * Tests the assistant's ability to transition from talent to employee context
 */
export const talentToEmployeeFlow: TestFlow = {
  id: 'talent-to-employee-flow',
  name: 'Talent to Employee Transition',
  description: 'Tests transitioning from talent acquisition assistant to employee assistant',
  category: 'transition',
  tags: ['transition', 'context-preservation'],
  steps: [
    // Start with talent context
    {
      message: "Tell me about Alex Johnson's application for the Senior Sales Associate position",
      expectedAssistantType: 'talent',
      expectedIntent: 'candidate_management',
      expectedEntities: ['candidate', 'job'],
      expectedFunctionCalls: ['getCandidateById'],
      notes: 'Should retrieve and display candidate information'
    },
    
    // Continue in talent context
    {
      message: "When is their interview scheduled?",
      expectedAssistantType: 'talent',
      expectedIntent: 'interview_process',
      expectedEntities: ['candidate'],
      expectedFunctionCalls: ['getInterviewDetails'],
      notes: 'Should maintain talent context and understand "their" refers to Alex Johnson'
    },
    
    // Transition to employee context
    {
      message: "I need to check if I have any scheduling conflicts that day",
      expectedAssistantType: 'employee',
      expectedIntent: 'schedule_management',
      expectedFunctionCalls: ['getManagerSchedule'],
      notes: 'Should transition to employee assistant for schedule-related query'
    },
    
    // Stay in employee context
    {
      message: "Are there any team meetings I should be aware of?",
      expectedAssistantType: 'employee',
      expectedIntent: 'schedule_management',
      expectedFunctionCalls: ['getTeamMeetings'],
      notes: 'Should maintain employee context'
    },
    
    // Reference candidate info while in employee context
    {
      message: "I'll need to prepare my team for Alex Johnson's possible onboarding",
      expectedAssistantType: 'employee',
      expectedIntent: 'employee_info',
      dataValidation: [
        {
          type: 'contains',
          target: 'text',
          value: 'Alex Johnson',
          description: 'Response should mention Alex Johnson (from previous context)'
        }
      ],
      notes: 'Should maintain employee context but remember Alex Johnson from earlier in the conversation'
    }
  ]
};

/**
 * Ambiguous Query Handling Flow
 * Tests the assistant's ability to handle queries that could fit either context
 */
export const ambiguousQueryFlow: TestFlow = {
  id: 'ambiguous-query-flow',
  name: 'Ambiguous Query Handling',
  description: 'Tests the assistant\'s ability to handle ambiguous queries that could fit either context',
  category: 'ambiguous',
  tags: ['transition', 'edge-case'],
  steps: [
    // Start with employee context
    {
      message: "Show me Devon's schedule for next week",
      expectedAssistantType: 'employee',
      expectedIntent: 'schedule_management',
      expectedEntities: ['employee', 'time_period'],
      notes: 'Should establish employee context'
    },
    
    // Ambiguous query - should stay in current context (employee)
    {
      message: "What's happening on March 15th?",
      expectedAssistantType: 'employee',
      expectedIntent: 'schedule_management',
      expectedEntities: ['date'],
      notes: 'Should maintain employee context for ambiguous date query'
    },
    
    // Clear transition to talent
    {
      message: "Show me candidates for the Senior Sales Associate position",
      expectedAssistantType: 'talent',
      expectedIntent: 'candidate_management',
      expectedEntities: ['job'],
      notes: 'Should transition to talent context'
    },
    
    // Ambiguous query - should stay in current context (talent)
    {
      message: "What's happening on March 15th?",
      expectedAssistantType: 'talent',
      expectedIntent: 'interview_process',
      expectedEntities: ['date'],
      notes: 'Should maintain talent context for the same ambiguous date query'
    },
    
    // Very ambiguous query with no strong signals
    {
      message: "Can you update me on the latest developments?",
      expectedAssistantType: 'talent', // Expecting to maintain previous context
      notes: 'Should maintain previous context (talent) for very ambiguous query'
    },
    
    // Query with mixed signals but stronger employee context
    {
      message: "Devon mentioned something about an interview. What do I have scheduled with them?",
      expectedAssistantType: 'employee',
      expectedEntities: ['employee'],
      notes: 'Should transition to employee context for query with mixed signals but stronger employee entity'
    }
  ]
};

/**
 * Multi-Intent Query Flow
 * Tests the assistant's ability to handle queries with multiple intents
 */
export const multiIntentFlow: TestFlow = {
  id: 'multi-intent-flow',
  name: 'Multi-Intent Query Handling',
  description: 'Tests the assistant\'s ability to handle queries that contain multiple intents',
  category: 'transition',
  tags: ['complex', 'multi-intent'],
  steps: [
    // Simple query to establish context
    {
      message: "Show me my team's schedule for next week",
      expectedAssistantType: 'employee',
      expectedIntent: 'schedule_management',
      notes: 'Should establish employee context'
    },
    
    // Query with both employee and talent intents, but employee dominant
    {
      message: "I need to arrange coverage for Devon while they interview candidates for the Senior Sales Associate position",
      expectedAssistantType: 'employee',
      expectedEntities: ['employee', 'job'],
      notes: 'Should maintain employee context for dominant intent while acknowledging talent aspects'
    },
    
    // Query with both intents, but talent dominant
    {
      message: "Before I schedule Alex Johnson's interview, can you check if any team members are on leave that day?",
      expectedAssistantType: 'talent',
      expectedEntities: ['candidate', 'employee'],
      notes: 'Should transition to talent context for dominant intent while including employee context'
    },
    
    // Compound request requiring both contexts
    {
      message: "I want to see which of my team members are available to interview Alex Johnson on Tuesday afternoon",
      expectedAssistantType: 'talent',
      expectedEntities: ['candidate', 'date', 'time_period'],
      expectedFunctionCalls: ['getTeamAvailability', 'scheduleInterview'],
      notes: 'Should process both employee and talent aspects but maintain talent context for interview scheduling'
    },
    
    // Follow-up query about a specific team member
    {
      message: "Can you confirm Devon's availability for that interview?",
      expectedAssistantType: 'talent',
      expectedEntities: ['employee'],
      notes: 'Should retrieve employee schedule data while maintaining talent context'
    }
  ]
};

/**
 * Context Preservation Flow
 * Tests the assistant's ability to maintain context across transitions
 */
export const contextPreservationFlow: TestFlow = {
  id: 'context-preservation-flow',
  name: 'Context Preservation',
  description: 'Tests the assistant\'s ability to maintain context across assistant transitions',
  category: 'transition',
  tags: ['context', 'complex'],
  steps: [
    // Set up context with multiple entities
    {
      message: "Devon and Jordan need to coordinate for the upcoming store event on March 15th",
      expectedAssistantType: 'employee',
      expectedEntities: ['employee', 'date'],
      notes: 'Should establish context with multiple employees and a date'
    },
    
    // Reference entities from previous context
    {
      message: "What are their current shifts on that day?",
      expectedAssistantType: 'employee',
      expectedIntent: 'schedule_management',
      notes: 'Should understand "their" refers to Devon and Jordan, and "that day" refers to March 15th'
    },
    
    // Transition to talent context but preserve employee entities
    {
      message: "We also have interviews for the Senior Sales Associate position that day. Will there be any conflicts?",
      expectedAssistantType: 'talent',
      expectedIntent: 'interview_process',
      notes: 'Should transition to talent context while preserving knowledge about Devon, Jordan, and March 15th'
    },
    
    // Add new entity to context
    {
      message: "Alex Johnson's interview is scheduled for 2 PM. Will either Devon or Jordan be available to join?",
      expectedAssistantType: 'talent',
      expectedEntities: ['candidate', 'time_period', 'employee'],
      notes: 'Should maintain talent context and add Alex Johnson and 2 PM to context'
    },
    
    // Transition back to employee context with preserved entity knowledge
    {
      message: "I need to update their schedules to accommodate this interview",
      expectedAssistantType: 'employee',
      expectedIntent: 'schedule_management',
      notes: 'Should transition back to employee context while remembering all entities from conversation'
    },
    
    // Test complex reference resolution
    {
      message: "Send meeting invites to all of them for this event",
      expectedAssistantType: 'employee',
      notes: 'Should understand "all of them" refers to Devon, Jordan, and possibly Alex Johnson'
    }
  ]
};

// Export all transition flows
export const transitionFlows: TestFlow[] = [
  employeeToTalentFlow,
  talentToEmployeeFlow,
  ambiguousQueryFlow,
  multiIntentFlow,
  contextPreservationFlow
];