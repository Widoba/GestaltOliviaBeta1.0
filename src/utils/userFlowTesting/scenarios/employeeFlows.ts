/**
 * Employee Assistant Test Scenarios
 * 
 * Test flows for employee management, schedules, tasks, and recognition
 */

// Using require for CommonJS compatibility
const { TestFlow } = require('../types');

/**
 * Employee Schedule Management Flow
 * Tests the assistant's ability to handle employee schedule queries
 */
const employeeScheduleFlow = {
  id: 'employee-schedule-flow',
  name: 'Employee Schedule Management',
  description: 'Tests the assistant\'s ability to handle employee schedule queries and updates',
  category: 'employee',
  tags: ['schedule', 'happy-path'],
  steps: [
    // Initial schedule query
    {
      message: "What's my team's schedule for next week?",
      expectedAssistantType: 'employee',
      expectedIntent: 'schedule_management',
      expectedEntities: ['time_period'],
      expectedFunctionCalls: ['getTeamSchedules'],
      dataValidation: [
        {
          type: 'entityPresent',
          target: 'structuredData',
          value: 'shift',
          description: 'Response should contain shift data'
        }
      ],
      notes: 'Should return team schedules as structured data'
    },
    
    // Specific employee schedule
    {
      message: "Show me Devon's schedule for March 10th",
      expectedAssistantType: 'employee',
      expectedIntent: 'schedule_management',
      expectedEntities: ['employee', 'date'],
      expectedFunctionCalls: ['getEmployeeSchedule'],
      dataValidation: [
        {
          type: 'contains',
          target: 'text',
          value: 'Devon',
          description: 'Response should mention Devon'
        }
      ],
      notes: 'Should retrieve a specific employee\'s schedule for a specific date'
    },
    
    // Schedule conflict query
    {
      message: "Are there any scheduling conflicts next week?",
      expectedAssistantType: 'employee',
      expectedIntent: 'schedule_management',
      expectedFunctionCalls: ['getScheduleConflicts'],
      notes: 'Should detect and report any scheduling conflicts'
    },
    
    // Schedule change request
    {
      message: "I need to move Devon's shift on Friday to Saturday morning",
      expectedAssistantType: 'employee',
      expectedIntent: 'schedule_management',
      expectedEntities: ['employee', 'date', 'time_period'],
      expectedFunctionCalls: ['updateShift'],
      notes: 'Should understand the request to change a shift'
    }
  ]
};

/**
 * Employee Task Management Flow
 * Tests the assistant's ability to handle employee task queries and updates
 */
const employeeTaskFlow = {
  id: 'employee-task-flow',
  name: 'Employee Task Management',
  description: 'Tests the assistant\'s ability to handle task management and updates',
  category: 'employee',
  tags: ['tasks', 'happy-path'],
  steps: [
    // View pending tasks
    {
      message: "What tasks do I need to complete this week?",
      expectedAssistantType: 'employee',
      expectedIntent: 'task_management',
      expectedEntities: ['time_period'],
      expectedFunctionCalls: ['getTasksByManagerId'],
      dataValidation: [
        {
          type: 'entityPresent',
          target: 'structuredData',
          value: 'task',
          description: 'Response should contain task data'
        }
      ],
      notes: 'Should return pending tasks for the current manager'
    },
    
    // View task details
    {
      message: "Give me more details about the quarterly performance reviews task",
      expectedAssistantType: 'employee',
      expectedIntent: 'task_management',
      expectedEntities: ['task'],
      expectedFunctionCalls: ['getTaskDetails'],
      notes: 'Should retrieve and display detailed information about a specific task'
    },
    
    // Complete a task
    {
      message: "Mark the performance reviews task as completed",
      expectedAssistantType: 'employee',
      expectedIntent: 'task_management',
      expectedEntities: ['task'],
      expectedFunctionCalls: ['updateTaskStatus'],
      notes: 'Should update the status of a task to completed'
    },
    
    // Assign a new task
    {
      message: "Create a new task for Devon to update the store displays by Friday",
      expectedAssistantType: 'employee',
      expectedIntent: 'task_management',
      expectedEntities: ['employee', 'date'],
      expectedFunctionCalls: ['createTask'],
      notes: 'Should create a new task with specified details'
    }
  ]
};

/**
 * Employee Recognition Flow
 * Tests the assistant's ability to handle employee recognition
 */
const employeeRecognitionFlow = {
  id: 'employee-recognition-flow',
  name: 'Employee Recognition',
  description: 'Tests the assistant\'s ability to handle employee recognition and feedback',
  category: 'employee',
  tags: ['recognition', 'happy-path'],
  steps: [
    // View recognition history
    {
      message: "Show me recent employee recognition in my team",
      expectedAssistantType: 'employee',
      expectedIntent: 'recognition',
      expectedFunctionCalls: ['getRecognitionHistory'],
      dataValidation: [
        {
          type: 'entityPresent',
          target: 'structuredData',
          value: 'recognition',
          description: 'Response should contain recognition data'
        }
      ],
      notes: 'Should display recent recognition entries for the team'
    },
    
    // Create recognition
    {
      message: "I want to recognize Devon for excellent customer service with the difficult customer yesterday",
      expectedAssistantType: 'employee',
      expectedIntent: 'recognition',
      expectedEntities: ['employee'],
      expectedFunctionCalls: ['createRecognition'],
      notes: 'Should create a new recognition entry for the specified employee'
    },
    
    // View employee recognition stats
    {
      message: "What's Devon's recognition history for the past month?",
      expectedAssistantType: 'employee',
      expectedIntent: 'recognition',
      expectedEntities: ['employee', 'time_period'],
      expectedFunctionCalls: ['getEmployeeRecognitionHistory'],
      notes: 'Should retrieve recognition history for a specific employee'
    }
  ]
};

/**
 * Employee Information Flow
 * Tests the assistant's ability to retrieve and display employee information
 */
const employeeInfoFlow = {
  id: 'employee-info-flow',
  name: 'Employee Information',
  description: 'Tests the assistant\'s ability to retrieve and display employee information',
  category: 'employee',
  tags: ['info', 'happy-path'],
  steps: [
    // Basic employee information
    {
      message: "Tell me about Devon's role and department",
      expectedAssistantType: 'employee',
      expectedIntent: 'employee_info',
      expectedEntities: ['employee'],
      expectedFunctionCalls: ['getEmployeeById'],
      dataValidation: [
        {
          type: 'contains',
          target: 'text',
          value: 'Devon',
          description: 'Response should mention Devon'
        }
      ],
      notes: 'Should retrieve and display basic employee information'
    },
    
    // Team structure
    {
      message: "Who are my direct reports?",
      expectedAssistantType: 'employee',
      expectedIntent: 'employee_info',
      expectedFunctionCalls: ['getDirectReports'],
      dataValidation: [
        {
          type: 'entityPresent',
          target: 'structuredData',
          value: 'employee',
          description: 'Response should contain employee data'
        }
      ],
      notes: 'Should list all direct reports of the current manager'
    },
    
    // Department information
    {
      message: "Give me a breakdown of the Retail Operations department structure",
      expectedAssistantType: 'employee',
      expectedIntent: 'employee_info',
      expectedEntities: ['department'],
      expectedFunctionCalls: ['getDepartmentStructure'],
      notes: 'Should retrieve and display department structure information'
    }
  ]
};

/**
 * Employee Error Handling Flow
 * Tests how the assistant handles errors in employee-related scenarios
 */
const employeeErrorFlow = {
  id: 'employee-error-flow',
  name: 'Employee Error Handling',
  description: 'Tests the assistant\'s ability to handle errors in employee-related scenarios',
  category: 'error',
  tags: ['error', 'employee'],
  steps: [
    // Non-existent employee
    {
      message: "Show me the schedule for Sarah Johnson",
      expectedAssistantType: 'employee',
      expectedIntent: 'schedule_management',
      expectedEntities: ['employee'],
      notes: 'Should handle a query about a non-existent employee gracefully'
    },
    
    // Invalid date format
    {
      message: "Update Devon's schedule for tomorrow's tomorrow",
      expectedAssistantType: 'employee',
      expectedIntent: 'schedule_management',
      expectedEntities: ['employee'],
      notes: 'Should handle invalid date format gracefully'
    },
    
    // Insufficient information
    {
      message: "Create a new task",
      expectedAssistantType: 'employee',
      expectedIntent: 'task_management',
      notes: 'Should ask for more information to create a task'
    },
    
    // Permission-related error
    {
      message: "Change Jordan's manager to Alex",
      expectedAssistantType: 'employee',
      expectedIntent: 'employee_info',
      expectedEntities: ['employee'],
      notes: 'Should handle a request that requires special permissions gracefully'
    }
  ]
};

// Create the employee flows array
const employeeFlows = [
  employeeScheduleFlow,
  employeeTaskFlow,
  employeeRecognitionFlow,
  employeeInfoFlow,
  employeeErrorFlow
];

// Export for CommonJS
module.exports = {
  employeeFlows,
  employeeScheduleFlow,
  employeeTaskFlow,
  employeeRecognitionFlow,
  employeeInfoFlow,
  employeeErrorFlow
};