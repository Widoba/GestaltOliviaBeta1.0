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

### Current Phase
We are currently in Phase 3: Chat Experience & UI Integration, specifically after completing Step 1 (Interaction Patterns).

### Remaining Tasks

#### Enhanced Responses (Phase 3, Step 2):

- Implement function calling for data retrieval
- Create card-based UI for displaying structured data (schedules, tasks, etc.)
- Build clickable action buttons for task completion

#### Error Handling (Phase 3, Step 3):

- Create graceful degradation when API calls fail
- Implement retry logic for intermittent failures
- Build fallback responses for when data is unavailable

#### Prompt Tuning (Phase 4, Step 1):

- Test system prompt with various user inquiries
- Refine prompt based on response quality
- Optimize for minimal assistant switching

#### Performance Optimization (Phase 4, Step 2):

- Implement caching for frequently accessed data
- Create batched data fetching to reduce API calls
- Optimize prompt size to reduce token usage

#### User Flow Testing (Phase 4, Step 3):

- Test end-to-end conversation scenarios
- Verify data accuracy in responses
- Ensure proper assistant switching based on intent

## Technical Implementation Details

### Key Technical Decisions

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

## Conclusion
The Unified Assistant Prototype has successfully implemented a seamless chat experience that intelligently routes between an Employee Assistant and a Talent Acquisition Assistant. The system uses sophisticated prompt engineering, context management, and data injection to provide accurate, contextually relevant responses while maintaining a cohesive conversation flow.

As development continues, the focus will shift to enhancing the response capabilities, implementing robust error handling, tuning the prompts, optimizing performance, and conducting thorough user flow testing. The modular architecture we've established provides a solid foundation for these future improvements.

This development summary was created on March 7, 2025, and represents the project state as of that date.