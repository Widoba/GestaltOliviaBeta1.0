# Unified Assistant Prototype: Development Summary

## Project Overview

The Unified Assistant Prototype is a chat-based application that seamlessly merges two existing assistant systems:

1. **Employee Assistant (Olivia)**: Focuses on employee management, schedules, tasks, and recognition
2. **Talent Acquisition Assistant**: Specializes in recruitment, candidates, job postings, and hiring

The system provides a single interface for managers who need both functionalities, intelligently routing queries to the appropriate underlying assistant while maintaining a cohesive conversation flow.

## Project Architecture Overview

### Major Components

![Architecture Diagram](architecture-diagram.png)

The application follows a modular architecture with clear separation of concerns:

1. **UI Layer**: React components for the chat interface
2. **State Management**: React contexts for global state
3. **Services Layer**: API integration and data management
4. **Prompt Engineering**: System prompts for Claude's behavior
5. **Data Layer**: JSON data structures and access patterns

### Information Flow

1. **User Input**: The user submits a message through the chat interface
2. **Query Analysis**: The message is analyzed to determine intent and extract entities
3. **Data Retrieval**: Relevant data is retrieved based on the query analysis
4. **Prompt Construction**: A system prompt is constructed with relevant data and context
5. **API Request**: The message, context, and prompt are sent to the Anthropic API
6. **Response Processing**: The API response is processed and displayed to the user
7. **UI Updates**: The interface updates to reflect the active assistant and conversation state

### Component Contributions

| Component | Contribution to Overall Goal |
|-----------|------------------------------|
| **Chat UI** | Provides intuitive interface with visual cues for different assistants |
| **Context Management** | Maintains conversation history and handles context window limitations |
| **Query Analysis** | Determines intent and extracts entities to route to the right assistant |
| **Data Injection** | Provides relevant contextual data for accurate responses |
| **Prompt Engineering** | Defines assistant personalities and behavior guidelines |
| **Function Calling** | Enables structured data retrieval and action execution |
| **Error Handling** | Ensures graceful degradation during failures |

## Data Structure Documentation

### Core Data Structures

#### Employee

Represents an employee in the organization.

```typescript
interface Employee {
  employee_id: string;             // E.g., "E2001"
  employee_first_name: string;     // E.g., "Sam"
  employee_last_name: string;      // E.g., "Rodriguez"
  employee_email: string;          // E.g., "sam.rodriguez@lunchbag.com"
  employee_phone_number: string;   // E.g., "312-555-1001"
  employee_department: string;     // E.g., "Retail Operations"
  employee_role: string;           // E.g., "Store Manager"
  employee_position_title: string; // E.g., "Downtown Store Manager"
  employee_location: string;       // E.g., "Chicago Downtown"
  manager: string;                 // E.g., "E2004" - references another Employee.id
  direct_reports: string[];        // E.g., ["E2002", "E2003", "E2005"]
}
```

Sample JSON:
```json
{
  "employee_id": "E2001",
  "employee_first_name": "Sam",
  "employee_last_name": "Rodriguez",
  "employee_email": "sam.rodriguez@lunchbag.com",
  "employee_phone_number": "312-555-1001",
  "employee_department": "Retail Operations",
  "employee_role": "Store Manager",
  "employee_position_title": "Downtown Store Manager",
  "employee_location": "Chicago Downtown",
  "manager": "E2004",
  "direct_reports": ["E2002", "E2003", "E2005"]
}
```

#### Shift

Represents an employee's work schedule.

```typescript
interface Shift {
  shift_id: string;          // E.g., "S3001"
  employee_id: string;       // References Employee.employee_id
  date: string;              // E.g., "2025-03-07"
  start_time: string;        // E.g., "08:00"
  end_time: string;          // E.g., "17:00"
  location: string;          // E.g., "Chicago Downtown"
  role: string;              // E.g., "Store Manager"
  status: string;            // E.g., "confirmed", "swap_requested"
  notes?: string;            // Optional notes (e.g., "Family emergency")
}
```

#### Task Data

```typescript
// Employee Tasks
interface EmployeeTask {
  task_id: string;           // E.g., "ET4001"
  source_system: string;     // E.g., "employee"
  task_type: string;         // E.g., "assigned", "employee_care"
  title: string;             // E.g., "Complete quarterly performance reviews"
  description: string;       // E.g., "Submit performance evaluations for all direct reports"
  assigned_by?: string;      // References Employee.employee_id
  assigned_to: string;       // References Employee.employee_id
  related_employee?: string; // Optional reference to another employee
  due_date: string;          // E.g., "2025-03-15"
  priority: string;          // E.g., "high", "medium", "low"
  status: string;            // E.g., "pending", "in_progress", "completed"
  url: string;               // E.g., "/employee/tasks/ET4001"
  completion_type: string;   // E.g., "form", "response"
}

// Talent Acquisition Tasks
interface TalentTask {
  task_id: string;           // E.g., "TA4001"
  source_system: string;     // E.g., "talent"
  task_type: string;         // E.g., "interview", "decision"
  title: string;             // E.g., "Review candidate profile"
  description: string;       // E.g., "Review Jordan Williams' profile before scheduled interview"
  candidate_id: string;      // References Candidate.candidate_id
  assigned_to: string;       // References Employee.employee_id
  due_date: string;          // E.g., "2025-03-11"
  priority: string;          // E.g., "medium", "high"
  status: string;            // E.g., "pending", "scheduled"
  url: string;               // E.g., "/talent/tasks/TA4001"
  completion_type: string;   // E.g., "review", "interview", "form"
}

// Recognition Tasks
interface RecognitionTask {
  task_id: string;           // E.g., "RE4001"
  source_system: string;     // E.g., "recognition"
  task_type: string;         // E.g., "monthly_recognition"
  title: string;             // E.g., "Recognize team members"
  description: string;       // E.g., "Select team members to recognize for their performance this month"
  assigned_to: string;       // References Employee.employee_id
  due_date: string;          // E.g., "2025-03-30"
  priority: string;          // E.g., "medium"
  status: string;            // E.g., "pending"
  url: string;               // E.g., "/recognition/tasks/RE4001"
  completion_type: string;   // E.g., "selection"
}

// Shift Management Tasks
interface ShiftTask {
  task_id: string;           // E.g., "SM4001"
  source_system: string;     // E.g., "scheduling"
  task_type: string;         // E.g., "approve_swap"
  title: string;             // E.g., "Review Devon's shift swap request"
  description: string;       // E.g., "Devon has requested to swap their March 8th shift"
  related_employee: string;  // References Employee.employee_id
  related_shift: string;     // References Shift.shift_id
  assigned_to: string;       // References Employee.employee_id
  due_date: string;          // E.g., "2025-03-07"
  priority: string;          // E.g., "high"
  status: string;            // E.g., "pending"
  url: string;               // E.g., "/scheduling/tasks/SM4001"
  completion_type: string;   // E.g., "approval"
}
```

#### Job Data

```typescript
interface Job {
  job_req_id: string;          // E.g., "JR-12345"
  internal_job_req_id: string; // E.g., "INT-12345"
  job_title: string;           // E.g., "Senior Sales Associate"
  job_location: string;        // E.g., "Chicago Downtown"
  job_status: boolean;         // true for active, false for inactive
  brand: string;               // E.g., "lunchbag"
}
```

#### Candidate Data

```typescript
interface Candidate {
  candidate_id: string;         // E.g., "C1001"
  first_name: string;           // E.g., "Alex"
  last_name: string;            // E.g., "Johnson"
  job_title: string;            // E.g., "Senior Sales Associate"
  email: string;                // E.g., "alex.johnson@email.com"
  job_req_id: string;           // References Job.job_req_id
  job_location: string;         // E.g., "Chicago Downtown"
  phone_number: string;         // E.g., "312-555-0101"
  journey_status: string;       // E.g., "scheduling", "offer", "application"
  journey_status_detail: string; // E.g., "interview_scheduled", "offer_in_progress"
  interview_date?: string;      // Optional, E.g., "2025-03-10T14:00:00"
  start_date?: string;          // Optional, E.g., "2025-03-15"
  manager_notes?: string;       // Optional notes about the candidate
}
```

#### Recognition Data

```typescript
interface Recognition {
  recognition_id: string;     // E.g., "R5001"
  from_employee_id: string;   // References Employee.employee_id
  to_employee_id: string;     // References Employee.employee_id
  date: string;               // E.g., "2025-03-01"
  category: string;           // E.g., "leadership", "customer_service", "efficiency"
  message: string;            // E.g., "Great job managing the weekend sale event..."
  points: number;             // E.g., 50, 25
}
```

#### Message Interface

Represents a message in the chat interface.

```typescript
interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp: Date;
  assistantType?: 'unified' | 'employee' | 'talent';
  structuredData?: StructuredDataResponse;
}
```

#### Function Calling Interfaces

```typescript
interface FunctionCallRequest {
  name: string;
  arguments: Record<string, any>;
}

interface FunctionCallResponse {
  name: string;
  result: Record<string, any>;
  error?: string;
}

interface StructuredDataResponse {
  type: 'employee' | 'task' | 'shift' | 'candidate' | 'job';
  data: any[];
  actions?: ActionButton[];
}

interface ActionButton {
  id: string;
  label: string;
  action: string;
  entityId: string;
  entityType: string;
  variant?: 'primary' | 'secondary' | 'success' | 'danger';
}
```

#### Entity and Intent Detection

Structures for query analysis:

```typescript
// Types of entities that can be detected
enum EntityType {
  EMPLOYEE = 'employee',
  CANDIDATE = 'candidate',
  JOB = 'job',
  DEPARTMENT = 'department',
  DATE = 'date',
  TIME_PERIOD = 'time_period',
  LOCATION = 'location',
  SKILL = 'skill',
  TASK = 'task',
}

// Entity detection result
interface DetectedEntity {
  type: EntityType;
  value: string;
  originalText: string;
  confidence: number;
  id?: string; // If we can match to a specific entity ID
  metadata?: Record<string, any>; // Additional information about the entity
}

// Intent categories
enum IntentCategory {
  EMPLOYEE_INFO = 'employee_info',
  SCHEDULE_MANAGEMENT = 'schedule_management',
  TASK_MANAGEMENT = 'task_management',
  RECOGNITION = 'recognition',
  JOB_MANAGEMENT = 'job_management',
  CANDIDATE_MANAGEMENT = 'candidate_management',
  INTERVIEW_PROCESS = 'interview_process',
  HIRING_WORKFLOW = 'hiring_workflow',
  GENERAL_QUESTION = 'general_question',
}
```

#### Error Handling Interfaces

```typescript
enum ErrorCategory {
  API_ERROR = 'api_error',
  DATA_ERROR = 'data_error',
  FUNCTION_ERROR = 'function_error',
  USER_ACTION_ERROR = 'user_action_error',
  SYSTEM_ERROR = 'system_error',
}

enum ErrorSeverity {
  FATAL = 'fatal',     // Unrecoverable error that prevents continued operation
  ERROR = 'error',     // Serious error that affects functionality
  WARNING = 'warning', // Issue that doesn't stop operation but should be addressed
  INFO = 'info',       // Informational message about a potential issue
}

interface AppError extends Error {
  category: ErrorCategory;
  severity: ErrorSeverity;
  recoverable: boolean;
  errorCode: string;
  userMessage: string;
  context?: Record<string, any>;
  originalError?: Error;
}
```

### Data Relationships

#### Employee Relationships:

- Employees have managers (other employees)
- Employees have direct reports (other employees)
- Employees have shifts and tasks assigned to them
- Employees can give and receive recognition

#### Job Relationships:

- Jobs have status information
- Jobs have locations
- Jobs have candidates applying to them

#### Candidate Relationships:

- Candidates apply for specific jobs
- Candidates progress through various journey statuses
- Candidates can have interview schedules

#### Tasks Relationships:

- Tasks are assigned to employees by other employees
- Tasks have different types and source systems
- Tasks can reference related entities (shifts, employees, candidates)

## Key Component Implementation

### System Prompt Engineering

#### Core Functionality
Defines the behavior, capabilities, and personality of Claude for different contexts through carefully crafted system prompts.

#### File Locations

- `/src/prompts/baseSystemPrompt.ts` - Main system prompt for the unified assistant
- `/src/prompts/employeeAssistantPrompt.ts` - Specialized prompt for the employee assistant
- `/src/prompts/talentAssistantPrompt.ts` - Specialized prompt for the talent acquisition assistant
- `/src/utils/promptUtils.ts` - Utilities for working with prompts

#### Key Methods/Functions

- `constructCustomPrompt(assistantType, queryContext, relevantData)`: Creates a tailored prompt for the current query
- `enhancePromptWithData(prompt, relevantData)`: Injects relevant data into prompts
- `selectPromptByAssistantType(assistantType)`: Returns the appropriate base prompt for the current assistant type

#### Dependencies

- Depends on data retrieval services for relevant data inclusion
- Used by the chat context for assistant messaging

#### Key Implementation Details
The base system prompt contains several key sections:

```typescript
// From baseSystemPrompt.ts
export const baseSystemPrompt = `
# UNIFIED ASSISTANT: DUAL ROLE SYSTEM

You are a unified assistant that serves two specialized functions for managers:

1. Employee Assistant (Olivia)
2. Talent Acquisition Assistant

Each query you receive will be routed to the appropriate assistant personality based on intent. Your task is to determine which assistant should respond, maintain continuity in conversations, and provide helpful responses using the appropriate persona.

## ASSISTANT DEFINITIONS
...

## INTENT CLASSIFICATION RULES
...

## DATA SCHEMAS AND RELATIONSHIPS
...

## TRANSITION HANDLING
...

## GENERAL BEHAVIOR GUIDELINES
...
`;
```

### Prompt Tuning Framework

#### Core Functionality
Provides a comprehensive framework for testing, evaluating, and optimizing system prompts to improve intent classification accuracy, assistant switching, transition handling, and context preservation.

#### File Locations

- `/src/utils/promptTesting/promptTestingFramework.ts` - Core testing framework and metrics
- `/src/utils/promptTesting/testCases.ts` - Standardized test cases for evaluation
- `/src/services/promptTuning/promptVariationManager.ts` - Manages prompt variations
- `/src/services/promptTuning/promptTuningService.ts` - Service for testing and optimization
- `/src/scripts/tunePrompts.ts` - CLI tool for prompt tuning
- `/src/examples/promptTuningExample.ts` - Example usage of the framework
- `/src/utils/promptTesting/README.md` - Framework documentation
- `/src/services/promptTuning/README.md` - Implementation documentation

#### Key Methods/Functions

- `runPromptTests(promptName, promptContent, testCases)`: Tests a prompt variation against standardized cases
- `comparePromptVariations(baseline, test)`: Compares performance between prompt variations
- `createVariation(name, description, basePrompt, employeePrompt, talentPrompt, changes)`: Creates a new prompt variation
- `runAllTests()`: Executes tests for all available prompt variations
- `createOptimizedPrompt()`: Combines the best aspects of different variations into an optimized prompt

#### Dependencies

- Uses the query analysis service for intent detection and classification
- Integrates with existing prompt utilities for prompt management
- Depends on the base prompts as the foundation for variations

#### Key Implementation Details

The framework includes several key components:

```typescript
// From promptTestingFramework.ts
// Interface for test cases
export interface PromptTestCase {
  id: string;
  query: string;
  expectedAssistantType: AssistantType;
  expectedIntent: IntentCategory;
  description: string;
  category: 'basic' | 'edge' | 'ambiguous' | 'context-dependent';
  tags: string[];
}

// Metrics for prompt performance
export interface PromptPerformanceMetrics {
  intentAccuracy: number;
  assistantTypeAccuracy: number;
  responseQuality: number;
  transitionSmoothnessScore: number;
  contextPreservationScore: number;
  overallScore: number;
}
```

The prompt variation manager creates specialized variations:

```typescript
// From promptVariationManager.ts
private createEnhancedIntentClassificationVariation(): PromptVariation {
  // Define changes for enhanced intent classification
  const changes = [
    'Added more examples for each intent category',
    'Expanded intent classification heuristics with confidence thresholds',
    'Added handling for overlapping intents',
    'Improved rules for ambiguous queries'
  ];
  
  // Create enhanced base prompt with improved intent classification
  const enhancedBasePrompt = baseSystemPrompt.replace(
    '### Classification Heuristics:',
    `### Classification Heuristics:

- For queries mentioning both employee and candidate/job topics, weigh entities by their significance in the query.
- Prioritize specific named entities over general terms when determining intent.
- For ambiguous queries with low confidence (<0.6) in any category, default to maintaining the current assistant rather than switching.
- Consider the centrality of terms in the query - terms mentioned in the beginning or as the subject carry more weight.
- When confidence scores for competing intents are within 0.2 of each other, consider it a mixed intent and maintain current context.`
  );
  
  // Create variation
  return this.createVariation(
    'Enhanced Intent Classification',
    'Improved intent classification rules and handling of ambiguous queries',
    enhancedBasePrompt,
    employeeAssistantPrompt,
    talentAssistantPrompt,
    changes
  );
}
```

The prompt tuning service can combine the best aspects of different variations:

```typescript
// From promptTuningService.ts
async createOptimizedPrompt(): Promise<PromptVariation> {
  // Run all tests to ensure we have metrics
  await this.runAllTests();
  
  // Get the best variation for each key metric
  const bestForIntentAccuracy = await this.getBestVariation('intentAccuracy');
  const bestForAssistantTypeAccuracy = await this.getBestVariation('assistantTypeAccuracy');
  const bestForTransitions = await this.getBestVariation('transitionSmoothnessScore');
  const bestForContextPreservation = await this.getBestVariation('contextPreservationScore');
  
  // Build optimized prompt by combining the best sections from each variation
  let optimizedBasePrompt = promptVariationManager.getBaseline().basePrompt;
  
  // Extract and combine sections from the best-performing variations
  // [Implementation details for extracting and combining sections]
  
  return promptVariationManager.createVariation(
    'Optimized Combined Prompt',
    'Combined prompt taking the best aspects from all variations',
    optimizedBasePrompt,
    promptVariationManager.getBaseline().employeePrompt,
    promptVariationManager.getBaseline().talentPrompt,
    changes
  );
}
```

### Context Window Management

#### Core Functionality
Manages conversation history to work efficiently within Claude's context window limits, including optimizing message history, generating summaries, and preserving important context.

#### File Locations

- `/src/services/historyService.ts` - Core service for history management
- `/src/services/contextEnhancedAnthropicService.ts` - Enhanced Anthropic service with context management
- `/src/contexts/ChatContext.tsx` - Chat context that uses these services

#### Key Methods/Functions

- `estimateTokenCount(text)`: Estimates token usage for text
- `optimizeMessageHistory(messages)`: Optimizes messages to fit within token budget
- `generateConversationSummary(messages)`: Creates summary for long conversations
- `prepareMessagesForRequest(messages, activeAssistant)`: Prepares messages for API request

#### Dependencies

- Used by ChatContext for message management
- Depends on Anthropic service for API integration

#### Key Implementation Details

```typescript
// From historyService.ts
// Token budgets for different components
const SYSTEM_PROMPT_TOKEN_BUDGET = 4000;
const DATA_CONTEXT_TOKEN_BUDGET = 5000;
const HISTORY_TOKEN_BUDGET = EFFECTIVE_TOKEN_LIMIT - SYSTEM_PROMPT_TOKEN_BUDGET - DATA_CONTEXT_TOKEN_BUDGET;

/**
 * Optimize messages to fit within token budget
 * @param messages Full message history
 * @param keepSystemMessages Whether to keep system messages
 * @returns Optimized message array
 */
optimizeMessageHistory(messages: Message[], keepSystemMessages: boolean = true): Message[] {
  // ... optimization logic
}

/**
 * Generate a summary of the conversation
 * @param messages Messages to summarize
 * @returns Summary message
 */
generateConversationSummary(messages: Message[]): Message {
  // ... summarization logic
}
```

### Data Injection Framework

#### Core Functionality
Analyzes user queries to extract entities and intents, retrieves relevant data, and formats it for inclusion in prompts to enable data-driven responses.

#### File Locations

- `/src/services/queryAnalysisService.ts` - Analyzes queries for entities and intents
- `/src/services/dataRetrievalService.ts` - Retrieves data based on entities and intents
- `/src/services/promptInjectionService.ts` - Formats data for prompt inclusion
- `/src/services/dataService.ts` - Core data access service

#### Key Methods/Functions

- `analyzeQuery(query)`: Analyzes a query for entities and intents
- `retrieveDataForQuery(query)`: Retrieves relevant data for a query
- `prepareDataForPrompt(query, options)`: Prepares formatted data for inclusion in prompts
- `formatDataForPrompt(data, analysis, options)`: Formats data for prompt inclusion

#### Dependencies

- Depends on dataService for data access
- Used by ChatContext for message processing
- Integrated with promptUtils for prompt construction

#### Key Implementation Details
The query analysis process:

```typescript
// From queryAnalysisService.ts
/**
 * Analyze a user query for entities and intents
 * @param query User query text
 * @returns Analysis result with entities and intents
 */
async analyzeQuery(query: string): Promise<QueryAnalysis> {
  const lowerQuery = query.toLowerCase();
  
  // Detect entities
  const entities = await this.detectEntities(lowerQuery);
  
  // Detect intents
  const intents = this.detectIntents(lowerQuery, entities);
  
  // Determine primary intent (highest confidence)
  const sortedIntents = [...intents].sort((a, b) => b.confidence - a.confidence);
  const primaryIntent = sortedIntents[0];
  const secondaryIntents = sortedIntents.slice(1);
  
  // Determine assistant type based on intents
  const assistantType = this.determineAssistantType(primaryIntent, secondaryIntents);
  
  // Calculate overall confidence
  const confidenceScore = this.calculateConfidenceScore(primaryIntent, entities);
  
  // Determine if data is required
  const requiresData = primaryIntent.requiresData || 
    entities.length > 0 || 
    secondaryIntents.some(intent => intent.requiresData && intent.confidence > 0.4);
  
  return {
    entities,
    primaryIntent,
    secondaryIntents,
    assistantType,
    confidenceScore,
    requiresData
  };
}
```

### Enhanced Responses

#### Core Functionality
Enables the assistant to retrieve structured data and perform actions through a function calling mechanism, displaying the results in an interactive card-based UI.

#### File Locations

- `/src/services/anthropicService.ts` - Claude API integration with function calling
- `/src/services/functionCallingService.ts` - Function definitions and execution logic
- `/src/services/contextEnhancedAnthropicService.ts` - Integration of function calls with context
- `/src/components/cards/BaseCard.tsx` - Foundation for all card components
- `/src/components/cards/EmployeeCard.tsx` - Employee data visualization
- `/src/components/cards/TaskCard.tsx` - Task data with action buttons
- `/src/components/cards/ShiftCard.tsx` - Shift data with approval actions
- `/src/components/cards/CandidateCard.tsx` - Candidate profile visualization
- `/src/components/cards/JobCard.tsx` - Job posting details
- `/src/components/StructuredDataDisplay.tsx` - Container for structured data visualization

#### Key Methods/Functions

- `callFunctionWithName(name, args)`: Executes a function by name with provided arguments
- `registerFunction(name, fn, schema)`: Registers a function for the function calling system
- `handleFunctionCall(functionCall)`: Processes a function call from Claude
- `processFunctionResults(results)`: Integrates function results into the conversation
- `renderStructuredData(data)`: Renders appropriate card components based on data type
- `completeAction(actionId, entityId, entityType)`: Executes actions triggered by UI buttons

#### Dependencies

- Integrated with Anthropic API via anthropicService
- Used by ChatContext for handling function calls in messages
- Depends on card components for data visualization

#### Key Implementation Details

Function calling implementation:

```typescript
// From anthropicService.ts
/**
 * Send a message to Claude with function calling capabilities
 * @param messages Message history
 * @param systemPrompt System prompt
 * @param functions Available functions
 * @returns Claude's response with potential function calls
 */
async sendMessageWithFunctions(
  messages: Message[], 
  systemPrompt: string,
  functions: FunctionDefinition[]
): Promise<AnthropicResponse> {
  try {
    // Format messages for Anthropic API
    const formattedMessages = this.formatMessagesForAPI(messages);
    
    // Make API request with function definitions
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: this.maxTokens,
      system: systemPrompt,
      messages: formattedMessages,
      tools: [{
        type: "function",
        functions: functions
      }]
    });
    
    // Process and return response
    return this.processResponse(response);
  } catch (error) {
    this.handleApiError(error);
  }
}
```

Card component implementation:

```tsx
// From TaskCard.tsx
const TaskCard: React.FC<TaskCardProps> = ({ task, onActionClick }) => {
  const priorityColor = getPriorityColor(task.priority);
  const statusBadge = getStatusBadge(task.status);
  const dueDate = new Date(task.due_date);
  const isOverdue = dueDate < new Date() && task.status !== 'completed';
  
  return (
    <BaseCard
      title={task.title}
      subtitle={`Task ID: ${task.task_id}`}
      icon={<TaskIcon />}
      headerColor={priorityColor}
      badges={[statusBadge]}
    >
      <div className="task-details">
        <p className="task-description">{task.description}</p>
        
        <div className="task-metadata">
          <MetadataItem label="Due Date" value={formatDate(task.due_date)} isAlert={isOverdue} />
          <MetadataItem label="Priority" value={capitalizeFirst(task.priority)} />
          <MetadataItem label="Type" value={formatTaskType(task.task_type)} />
        </div>
        
        {task.status !== 'completed' && (
          <div className="task-actions">
            <ActionButton 
              label="Complete Task" 
              onClick={() => onActionClick('complete', task.task_id, 'task')}
              variant={isOverdue ? 'danger' : 'primary'}
            />
            {task.task_type === 'approve_swap' && (
              <>
                <ActionButton 
                  label="Approve" 
                  onClick={() => onActionClick('approve', task.task_id, 'task')}
                  variant="success"
                />
                <ActionButton 
                  label="Deny" 
                  onClick={() => onActionClick('deny', task.task_id, 'task')}
                  variant="secondary"
                />
              </>
            )}
          </div>
        )}
      </div>
    </BaseCard>
  );
};
```

Structured data display:

```tsx
// From StructuredDataDisplay.tsx
const StructuredDataDisplay: React.FC<StructuredDataDisplayProps> = ({ 
  data, 
  onActionClick 
}) => {
  // Select appropriate card type based on data type
  const renderCards = () => {
    if (!data || !data.data || data.data.length === 0) {
      return <EmptyState message="No data available" />;
    }
    
    switch (data.type) {
      case 'employee':
        return data.data.map(employee => (
          <EmployeeCard 
            key={employee.employee_id} 
            employee={employee}
            onActionClick={onActionClick}
            actions={data.actions?.filter(a => a.entityId === employee.employee_id)}
          />
        ));
      case 'task':
        return data.data.map(task => (
          <TaskCard 
            key={task.task_id} 
            task={task}
            onActionClick={onActionClick} 
          />
        ));
      case 'shift':
        return data.data.map(shift => (
          <ShiftCard 
            key={shift.shift_id} 
            shift={shift}
            onActionClick={onActionClick}
          />
        ));
      case 'candidate':
        return data.data.map(candidate => (
          <CandidateCard 
            key={candidate.candidate_id} 
            candidate={candidate}
            onActionClick={onActionClick}
          />
        ));
      case 'job':
        return data.data.map(job => (
          <JobCard 
            key={job.job_req_id} 
            job={job}
            onActionClick={onActionClick}
          />
        ));
      default:
        return <GenericDataDisplay data={data.data} />;
    }
  };

  return (
    <div className="structured-data-container">
      {renderCards()}
    </div>
  );
};
```

### Error Handling

#### Core Functionality
Provides robust error handling throughout the application, including API errors, data errors, and user action errors, with graceful degradation and meaningful feedback.

#### File Locations

- `/src/services/errorHandling.ts` - Core error handling utilities and error classes
- `/src/services/contextEnhancedAnthropicService.ts` - API error handling and retry logic
- `/src/services/functionCallingService.ts` - Function call error handling
- `/src/services/fallbackResponseService.ts` - Fallback responses for error conditions
- `/src/components/ErrorBoundary.tsx` - React error boundary component
- `/src/components/ErrorDisplay.tsx` - Error visualization component

#### Key Methods/Functions

- `createApiError(message, options)`: Creates a standardized API error
- `handleApiError(error, retryCount)`: Handles API errors with retry logic
- `createDataError(message, options)`: Creates a standardized data error
- `handleDataRetrievalError(error, partialData)`: Processes data retrieval errors
- `generateFallbackResponse(query, errorType)`: Creates fallback responses
- `logError(error, context)`: Structured error logging
- `recoverFromError(error)`: Attempts to recover from recoverable errors

#### Dependencies

- Used throughout the application for consistent error handling
- Integrated with ChatContext for error state management
- Utilized by UI components for error display

#### Key Implementation Details

Error taxonomy and handling:

```typescript
// From errorHandling.ts
/**
 * Create a standardized API error
 * @param message Error message
 * @param options Additional error options
 * @returns Structured API error
 */
export function createApiError(
  message: string, 
  options: Partial<AppErrorOptions> = {}
): AppError {
  return new AppError({
    message,
    category: ErrorCategory.API_ERROR,
    severity: options.severity || ErrorSeverity.ERROR,
    recoverable: options.recoverable !== undefined ? options.recoverable : true,
    errorCode: options.errorCode || 'API_ERROR',
    userMessage: options.userMessage || 'There was a problem connecting to the service. Please try again.',
    context: options.context,
    originalError: options.originalError
  });
}

/**
 * Handle API errors with retry logic for transient issues
 * @param error The original error
 * @param retryCount Current retry count
 * @param maxRetries Maximum number of retries
 * @param retryDelay Base delay between retries in ms
 * @returns Promise that resolves if retry succeeds, or rejects with enhanced error
 */
export async function handleApiError(
  error: any,
  retryCount = 0,
  maxRetries = 3,
  retryDelay = 500
): Promise<never> {
  // Enhance error with additional context
  const appError = error instanceof AppError 
    ? error 
    : createApiError(error.message || 'Unknown API error', {
        originalError: error,
        context: { retryCount, maxRetries }
      });
  
  // Log the error
  logError(appError, { retryCount, maxRetries });
  
  // Determine if retry is possible
  const canRetry = appError.recoverable && 
    retryCount < maxRetries && 
    isRetryableStatusCode(error.status);
  
  if (canRetry) {
    // Calculate exponential backoff with jitter
    const delay = calculateBackoffWithJitter(retryDelay, retryCount);
    
    // Wait before retrying
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Update context and return for retry
    appError.context = { ...appError.context, retryCount: retryCount + 1 };
    throw appError;
  } else {
    // No more retries, add severity based on retry exhaustion
    if (retryCount > 0 && retryCount >= maxRetries) {
      appError.severity = ErrorSeverity.ERROR;
      appError.userMessage = 'Service is currently unavailable after multiple attempts. Please try again later.';
    }
    
    throw appError;
  }
}
```

Fallback response system:

```typescript
// From fallbackResponseService.ts
/**
 * Generate a fallback response based on the query and error type
 * @param query The original user query
 * @param errorType Type of error that occurred
 * @param assistantType Current assistant type
 * @returns Appropriate fallback response
 */
export function generateFallbackResponse(
  query: string,
  errorType: ErrorCategory,
  assistantType: AssistantType = 'unified'
): string {
  // Check for assistant-specific fallbacks first
  const assistantFallback = getAssistantSpecificFallback(errorType, assistantType);
  if (assistantFallback) return assistantFallback;
  
  // Check for query-specific fallbacks
  const queryFallback = getQueryContextFallback(query, errorType);
  if (queryFallback) return queryFallback;
  
  // Generic fallbacks by error type
  switch (errorType) {
    case ErrorCategory.API_ERROR:
      return "I'm having trouble connecting to our systems right now. Let's try again in a moment, or you can ask me something else.";
    
    case ErrorCategory.DATA_ERROR:
      return "I couldn't retrieve the specific information you're looking for. Can you verify the details or try a different query?";
    
    case ErrorCategory.FUNCTION_ERROR:
      return "I wasn't able to complete that action successfully. There might be a technical issue or the action may not be available right now.";
    
    case ErrorCategory.USER_ACTION_ERROR:
      return "I couldn't process that request. Please check the information provided and try again.";
    
    case ErrorCategory.SYSTEM_ERROR:
    default:
      return "I'm experiencing a technical issue right now. Please try again later, or contact support if the problem persists.";
  }
}

/**
 * Get assistant-specific fallbacks based on the current assistant
 */
function getAssistantSpecificFallback(
  errorType: ErrorCategory,
  assistantType: AssistantType
): string | null {
  if (assistantType === 'employee') {
    if (errorType === ErrorCategory.DATA_ERROR) {
      return "I'm having trouble accessing the employee information system right now. I can help with general questions, or we can try again in a moment.";
    }
  } else if (assistantType === 'talent') {
    if (errorType === ErrorCategory.DATA_ERROR) {
      return "I'm unable to access the recruitment information system at the moment. I can answer general questions about recruitment processes, or we can try again later.";
    }
  }
  
  return null;
}
```

Error boundary component:

```tsx
// From ErrorBoundary.tsx
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log the error
    logError(error, { component: this.props.componentName, errorInfo });
    this.setState({ errorInfo });
    
    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  resetError = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      // Render the fallback UI
      return (
        <div className="error-boundary">
          <ErrorDisplay 
            error={this.state.error!}
            componentName={this.props.componentName}
            onReset={this.resetError}
          />
        </div>
      );
    }

    return this.props.children;
  }
}
```

### UI Components and Interaction Patterns

#### Core Functionality
Provides the user-facing interface with responsive, animated components that communicate system state and provide visual cues for assistant switching.

#### File Locations

- `/src/components/ChatContainer.tsx` - Main chat container component
- `/src/components/AssistantMessage.tsx` - Messages from the assistant
- `/src/components/UserMessage.tsx` - Messages from the user
- `/src/components/SystemMessage.tsx` - System messages (transitions, warnings)
- `/src/components/MessageInput.tsx` - User input component
- `/src/components/AssistantAvatar.tsx` - Visual avatar for each assistant type
- `/src/components/SystemMessageTransition.tsx` - Animated transition between assistants
- `/src/components/TypingIndicator.tsx` - Typing indicator for loading state
- `/src/components/MessageGroup.tsx` - Message grouping component
- `/src/components/FeedbackToast.tsx` - Feedback notifications

#### Key Methods/Functions

- `renderMessage(message)`: Renders the appropriate message component
- `groupMessages(messages)`: Groups related messages together
- `handleSuggestionClick(suggestion)`: Handles suggestion clicks in the input

#### Dependencies

- Uses ChatContext for state management
- Depends on various UI components for rendering

#### Key Implementation Details
Assistant transitions:

```tsx
// From SystemMessageTransition.tsx
const SystemMessageTransition: React.FC<SystemMessageTransitionProps> = ({
  message,
  previousAssistant,
  newAssistant
}) => {
  const [showAnimation, setShowAnimation] = useState(false);
  
  useEffect(() => {
    // Trigger animation after component mount
    const timer = setTimeout(() => {
      setShowAnimation(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div className="flex w-full my-3 justify-center">
      <div className="flex items-center max-w-md bg-yellow-50 px-3 py-2 rounded-full border border-yellow-200 transition-all duration-500 ease-in-out">
        <div className={`flex transition-all duration-500 ease-in-out transform ${showAnimation ? 'opacity-0 scale-75 -translate-x-8' : 'opacity-100'}`}>
          <AssistantAvatar assistantType={previousAssistant} size="sm" />
        </div>
        
        <span className="mx-2 text-gray-600 text-sm">{message.content}</span>
        
        <div className={`flex transition-all duration-500 ease-in-out transform ${showAnimation ? 'opacity-100' : 'opacity-0 scale-75 translate-x-8'}`}>
          <AssistantAvatar assistantType={newAssistant} size="sm" animation={true} />
        </div>
      </div>
    </div>
  );
};
```

## Current State and Next Steps

### Completed Work
We have successfully implemented:

#### Project Structure and Setup:

- Created a React/Next.js project with TypeScript
- Set up component structure and folder organization
- Configured build tools and dependencies

#### Anthropic API Integration:

- Implemented secure API client with error handling
- Created retry mechanisms and token management
- Added API response processing

#### Data Layer:

- Created comprehensive data structures for all entity types
- Implemented data access services with caching
- Added relationship mapping between data entities

#### Prompt Engineering:

- Designed system prompts for different assistant types
- Created rules for intent classification and routing
- Implemented transition handling between assistants

#### Context Window Management:

- Built message optimization for Claude's context window
- Created summarization for long conversations
- Implemented token budget management

#### Data Injection Framework:

- Created entity and intent detection from queries
- Implemented data retrieval based on query analysis
- Added data formatting optimized for prompt inclusion

#### UI Components and Interaction Patterns:

- Built responsive chat interface with animations
- Created visual assistant switching cues
- Implemented typing indicators and loading states

#### Enhanced Responses:

- Implemented function calling for data retrieval via anthropicService.ts
- Created card-based UI components for displaying structured data 
- Developed specialized cards for different data types (Employee, Task, Shift, Candidate, Job)
- Added interactive action buttons for task completion, shift approval, etc.
- Integrated StructuredDataDisplay component for organized data presentation

#### Error Handling:

- Developed comprehensive error taxonomy with categories and severity levels
- Implemented structured error classes with meaningful user messages
- Added API error handling with retry mechanisms and exponential backoff
- Created fallback response system for graceful degradation
- Implemented UI-level error handling with React ErrorBoundary components
- Added data retrieval error handling with partial data support

#### Prompt Tuning:

- Created a comprehensive prompt testing framework with standardized test cases
- Developed metrics for measuring prompt performance (intent accuracy, assistant type accuracy, etc.)
- Built a system for creating and managing prompt variations
- Implemented a prompt tuning service for comparing variations and creating optimized prompts
- Developed a CLI tool for running tests, comparing results, and generating reports
- Enhanced intent classification with better heuristics
- Improved transition handling with more natural phrases
- Added context preservation guidelines and entity tracking

### Current Phase
We are currently in Phase 4: Quality Assurance & Optimization, and have completed Step 2 (Performance Optimization). We are now preparing to move to Step 3 (User Flow Testing).

### Remaining Tasks

#### User Flow Testing (Phase 4, Step 3):

- Test end-to-end conversation scenarios
- Verify data accuracy in responses
- Ensure proper assistant switching based on intent

## Technical Implementation Details

### Key Technical Decisions

#### Performance Optimization

We've implemented several performance optimization strategies to improve responsiveness and efficiency:

1. **Advanced Caching System** 
   - Category-based caching with different TTLs based on data volatility
   - LRU (Least Recently Used) eviction when cache exceeds size limits
   - Memory-efficient storage with automatic cache maintenance
   - Cache statistics for monitoring performance

2. **Batched Data Fetching**
   - Request batching to combine similar data requests within a time window
   - Parallel data loading for different data types
   - Preloading of commonly accessed data
   - Efficient relationship resolution

3. **Prompt Size Optimization**
   - Dynamic prompt trimming based on query complexity
   - Selective inclusion of relevant data with priority-based filtering
   - Configurable compression levels (low, medium, high)
   - Token usage tracking and savings metrics

These optimizations significantly reduce API calls, minimize token usage, and improve overall responsiveness of the system.

#### Message Optimizations for Context Window:
We implemented a sophisticated token budget system that allocates tokens between:

- System prompt (4000 tokens)
- Data context (5000 tokens)
- Conversation history (remaining tokens)

This ensures we never exceed Claude's context window while prioritizing important information.

#### Entity Detection and Intent Classification:
We use a multi-stage approach:

- Pattern matching for common entities
- Confidence scoring based on match quality
- Intent detection using keyword presence and entity context
- Weighting of intents to determine primary intent

This provides accurate routing to the appropriate assistant.

#### Data Formatting Strategy:
We implemented adaptive data formatting that:

- Uses detailed format for specific queries with few entities
- Uses summary format for broader queries with many entities
- Adjusts detail level based on available token budget
- Prioritizes data directly relevant to the query

#### React Component Architecture:
We use a combination of:

- Context API for global state management
- Functional components with hooks
- Composition for UI component reusability
- Performance optimizations like memoization

#### Function Calling Architecture:
We implemented a flexible function calling system that:

- Defines function schemas in a central registry
- Supports both synchronous and asynchronous function execution
- Handles errors gracefully with fallback mechanisms
- Provides structured data responses for UI rendering

#### Error Handling Strategy:
We developed a multi-layered error handling approach:

- Categorized errors by type (API, data, function, user action, system)
- Assigned severity levels to prioritize error handling
- Created recoverable vs. non-recoverable error distinction
- Implemented hierarchical fallback responses
- Added visual error feedback with user recovery options

### Challenges and Solutions

#### Context Window Management:

- Challenge: Claude has a fixed context window, but conversations can grow arbitrarily long.
- Solution: Implemented message optimization, summarization, and token budgeting to effectively manage the context window.

#### Accurate Entity Detection:

- Challenge: Detecting entities in natural language is complex due to ambiguity.
- Solution: Used a combination of pattern matching, confidence scoring, and relationship context to improve accuracy.

#### Data Size vs. Relevance:

- Challenge: Including all potentially relevant data would exceed context window limits.
- Solution: Implemented relevance-based filtering and adaptive formatting to include only the most important data.

#### Assistant Transitions:

- Challenge: Switching between assistants could be jarring to users.
- Solution: Created smooth visual transitions and maintained conversation context across assistant switches.

#### Function Call Error Handling:

- Challenge: Function calls can fail due to various reasons (data unavailability, permissions, system issues).
- Solution: Implemented partial data handling, graceful degradation, and clear error messaging tied to specific function failures.

#### Structured Data Presentation:

- Challenge: Presenting complex structured data in a chat interface can be unwieldy.
- Solution: Developed card-based UI components optimized for different data types with interactive elements for common actions.

### Trade-offs

#### Client-Side vs. Server-Side Processing:

- We chose to do query analysis and data retrieval on the server-side to protect data privacy and reduce client-side load.
- Trade-off: Slightly longer response times but better security and performance for complex operations.

#### Data Caching vs. Freshness:

- We implemented caching with a 5-minute TTL to balance performance with data freshness.
- Trade-off: Slight potential for stale data in exchange for faster response times.

#### Animation Complexity vs. Performance:

- We limited complex animations to key interactions to maintain performance on lower-end devices.
- Trade-off: Some visual polish sacrificed for broader device compatibility.

#### Prompt Size vs. Detail Level:

- We dynamically adjust data detail level based on query specificity.
- Trade-off: Some queries might receive less detailed data, but we ensure the most relevant information is included.

#### Error Recovery vs. User Notification:

- We automatically retry recoverable errors but provide clear notifications for non-recoverable errors.
- Trade-off: Potential slight delays during retries, but higher success rates and better user experience overall.

#### Function Calling Flexibility vs. Predictability:

- We allow Claude to determine which functions to call rather than hardcoding function calls for specific intents.
- Trade-off: More flexibility and natural interactions, but occasionally less predictable behavior requiring additional prompt tuning.

#### Caching Strategy:

- Implemented a sophisticated category-based caching system with LRU eviction and TTL expiration.
- Trade-off: Slightly increased memory usage for significantly improved response times.

#### Data Batching:

- Implemented request batching for related data fetches to reduce redundant API/database calls.
- Trade-off: Small potential increase in latency for initial requests in a batch window in exchange for overall throughput improvement.

#### Prompt Optimization:

- Implemented dynamic prompt optimization with configurable compression levels.
- Trade-off: Slight risk of information loss with higher compression levels in exchange for token savings.

#### Prompt Testing Approach:

- We implemented a testing-based approach to prompt optimization rather than relying solely on manual adjustments.
- Trade-off: More systematic improvement but requires significant test case development and maintenance.

#### Prompt Variation Strategy:

- We created focused variations targeting specific aspects rather than entirely different prompt approaches.
- Trade-off: More incremental improvements but easier to identify which changes are effective.

## Conclusion
The Unified Assistant Prototype has successfully implemented a seamless chat experience that intelligently routes between an Employee Assistant and a Talent Acquisition Assistant. The system uses sophisticated prompt engineering, context management, data injection, function calling, error handling, and prompt tuning to provide accurate, contextually relevant responses while maintaining a cohesive conversation flow.

The project has progressed through several phases, from initial setup and core functionality to enhanced responses, error handling, and now prompt tuning. The comprehensive prompt testing framework will allow us to continually improve the system's accuracy and responsiveness, while the upcoming performance optimization and user flow testing will ensure a robust user experience.

With all major components now in place, the modular architecture we've established provides a solid foundation for fine-tuning and optimization as we move toward the final stages of development.

This development summary was updated on March 8, 2025, and represents the project state as of that date.