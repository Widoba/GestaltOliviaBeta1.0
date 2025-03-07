/**
 * Standardized Test Cases for Prompt Evaluation
 * 
 * Collection of test cases for evaluating prompt performance.
 */
import { IntentCategory } from '../../services/queryAnalysisService';
import { PromptTestCase } from './promptTestingFramework';

/**
 * Basic Employee Assistant Test Cases
 */
export const employeeBasicTestCases: PromptTestCase[] = [
  {
    id: 'EMP-B-001',
    query: "Show me Devon's schedule for next week",
    expectedAssistantType: 'employee',
    expectedIntent: IntentCategory.SCHEDULE_MANAGEMENT,
    description: "Basic schedule query with employee name",
    category: 'basic',
    tags: ['schedule', 'employee']
  },
  {
    id: 'EMP-B-002',
    query: "What tasks are due this week?",
    expectedAssistantType: 'employee',
    expectedIntent: IntentCategory.TASK_MANAGEMENT,
    description: "Basic task management query",
    category: 'basic',
    tags: ['tasks', 'deadline']
  },
  {
    id: 'EMP-B-003',
    query: "How can I recognize Devon for their work on the project?",
    expectedAssistantType: 'employee',
    expectedIntent: IntentCategory.RECOGNITION,
    description: "Basic recognition query",
    category: 'basic',
    tags: ['recognition', 'employee']
  },
  {
    id: 'EMP-B-004',
    query: "Who is on the retail operations team?",
    expectedAssistantType: 'employee',
    expectedIntent: IntentCategory.EMPLOYEE_INFO,
    description: "Basic employee information query about team",
    category: 'basic',
    tags: ['employee info', 'team']
  },
  {
    id: 'EMP-B-005',
    query: "I need to approve Devon's shift swap request",
    expectedAssistantType: 'employee',
    expectedIntent: IntentCategory.SCHEDULE_MANAGEMENT,
    description: "Shift swap approval request",
    category: 'basic',
    tags: ['schedule', 'approval', 'shift swap']
  }
];

/**
 * Basic Talent Acquisition Assistant Test Cases
 */
export const talentBasicTestCases: PromptTestCase[] = [
  {
    id: 'TAL-B-001',
    query: "Show me our open positions in Chicago",
    expectedAssistantType: 'talent',
    expectedIntent: IntentCategory.JOB_MANAGEMENT,
    description: "Basic job query with location",
    category: 'basic',
    tags: ['jobs', 'location']
  },
  {
    id: 'TAL-B-002',
    query: "What's the status of Jordan Williams' application?",
    expectedAssistantType: 'talent',
    expectedIntent: IntentCategory.CANDIDATE_MANAGEMENT,
    description: "Basic candidate status query",
    category: 'basic',
    tags: ['candidate', 'status']
  },
  {
    id: 'TAL-B-003',
    query: "Schedule an interview with Alex Johnson for Friday",
    expectedAssistantType: 'talent',
    expectedIntent: IntentCategory.INTERVIEW_PROCESS,
    description: "Basic interview scheduling request",
    category: 'basic',
    tags: ['interview', 'scheduling']
  },
  {
    id: 'TAL-B-004',
    query: "What's our onboarding process for new hires?",
    expectedAssistantType: 'talent',
    expectedIntent: IntentCategory.HIRING_WORKFLOW,
    description: "Basic hiring workflow query",
    category: 'basic',
    tags: ['onboarding', 'hiring']
  },
  {
    id: 'TAL-B-005',
    query: "Show me candidates for the inventory specialist position",
    expectedAssistantType: 'talent',
    expectedIntent: IntentCategory.CANDIDATE_MANAGEMENT,
    description: "Basic candidate search by position",
    category: 'basic',
    tags: ['candidates', 'job position']
  }
];

/**
 * Edge Case Test Cases
 */
export const edgeCaseTestCases: PromptTestCase[] = [
  {
    id: 'EDGE-001',
    query: "Devon needs time off but also has an interview scheduled",
    expectedAssistantType: 'employee', // Prioritize employee context 
    expectedIntent: IntentCategory.SCHEDULE_MANAGEMENT,
    description: "Mixed employee and talent context",
    category: 'edge',
    tags: ['mixed', 'ambiguous', 'schedule', 'interview']
  },
  {
    id: 'EDGE-002',
    query: "Review Devon's performance and Jordan's application",
    expectedAssistantType: 'unified', // Truly mixed intent
    expectedIntent: IntentCategory.EMPLOYEE_INFO,
    description: "Two clear intents for different assistants",
    category: 'edge',
    tags: ['mixed', 'performance', 'candidate']
  },
  {
    id: 'EDGE-003',
    query: "I need to prepare for my meeting tomorrow",
    expectedAssistantType: 'unified',
    expectedIntent: IntentCategory.GENERAL_QUESTION,
    description: "Vague query with no clear assistant preference",
    category: 'edge',
    tags: ['vague', 'general']
  },
  {
    id: 'EDGE-004',
    query: "The store manager position needs to be filled by Friday",
    expectedAssistantType: 'talent',
    expectedIntent: IntentCategory.JOB_MANAGEMENT,
    description: "Position could be employee or job role",
    category: 'edge',
    tags: ['ambiguous', 'position', 'deadline']
  },
  {
    id: 'EDGE-005',
    query: "Review feedback from the team",
    expectedAssistantType: 'employee',
    expectedIntent: IntentCategory.EMPLOYEE_INFO,
    description: "Feedback could be employee or candidate related",
    category: 'edge',
    tags: ['ambiguous', 'feedback']
  }
];

/**
 * Ambiguous Query Test Cases
 */
export const ambiguousTestCases: PromptTestCase[] = [
  {
    id: 'AMB-001',
    query: "Tell me about Jordan",
    expectedAssistantType: 'unified',
    expectedIntent: IntentCategory.GENERAL_QUESTION,
    description: "Jordan could be employee or candidate",
    category: 'ambiguous',
    tags: ['name', 'ambiguous']
  },
  {
    id: 'AMB-002',
    query: "Schedule for next week",
    expectedAssistantType: 'employee',
    expectedIntent: IntentCategory.SCHEDULE_MANAGEMENT,
    description: "Schedule could mean employee shifts or interviews",
    category: 'ambiguous',
    tags: ['schedule', 'ambiguous']
  },
  {
    id: 'AMB-003',
    query: "Update position information",
    expectedAssistantType: 'unified',
    expectedIntent: IntentCategory.GENERAL_QUESTION,
    description: "Position could mean employee role or job posting",
    category: 'ambiguous',
    tags: ['position', 'ambiguous']
  },
  {
    id: 'AMB-004',
    query: "Team performance review",
    expectedAssistantType: 'employee',
    expectedIntent: IntentCategory.EMPLOYEE_INFO,
    description: "Review could be employee performance or candidate review",
    category: 'ambiguous',
    tags: ['review', 'performance', 'ambiguous']
  },
  {
    id: 'AMB-005',
    query: "Help me prepare for my meeting",
    expectedAssistantType: 'unified',
    expectedIntent: IntentCategory.GENERAL_QUESTION,
    description: "Very general request with no specific context",
    category: 'ambiguous',
    tags: ['general', 'vague']
  }
];

/**
 * Context-Dependent Test Cases
 * These would typically be part of a conversation history
 */
export const contextDependentTestCases: PromptTestCase[] = [
  {
    id: 'CTX-001',
    query: "Show me more details",
    expectedAssistantType: 'unified', // Depends on previous context
    expectedIntent: IntentCategory.GENERAL_QUESTION,
    description: "Follow-up without specific context",
    category: 'context-dependent',
    tags: ['follow-up', 'vague']
  },
  {
    id: 'CTX-002',
    query: "When are they scheduled?",
    expectedAssistantType: 'unified', // Depends on who "they" refers to
    expectedIntent: IntentCategory.GENERAL_QUESTION,
    description: "Query with pronoun requiring previous context",
    category: 'context-dependent',
    tags: ['pronoun', 'schedule']
  },
  {
    id: 'CTX-003',
    query: "Approve that request",
    expectedAssistantType: 'unified', // Depends on what request was mentioned
    expectedIntent: IntentCategory.GENERAL_QUESTION,
    description: "Action request without specific context",
    category: 'context-dependent',
    tags: ['action', 'approval']
  },
  {
    id: 'CTX-004',
    query: "What about Taylor?",
    expectedAssistantType: 'unified', // Depends on previous context about Taylor
    expectedIntent: IntentCategory.GENERAL_QUESTION,
    description: "Follow-up about a person without context",
    category: 'context-dependent',
    tags: ['follow-up', 'person']
  },
  {
    id: 'CTX-005',
    query: "Move that to Friday instead",
    expectedAssistantType: 'unified', // Depends on what "that" refers to
    expectedIntent: IntentCategory.GENERAL_QUESTION,
    description: "Rescheduling request without specified event",
    category: 'context-dependent',
    tags: ['reschedule', 'vague']
  }
];

// Combine all test cases for comprehensive testing
export const allTestCases: PromptTestCase[] = [
  ...employeeBasicTestCases,
  ...talentBasicTestCases,
  ...edgeCaseTestCases,
  ...ambiguousTestCases,
  ...contextDependentTestCases
];