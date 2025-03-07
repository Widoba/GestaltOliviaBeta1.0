/**
 * Types and interfaces for the User Flow Testing Framework
 */

import { Message } from '../../contexts/ChatContext';
import { DetectedEntity, IntentCategory } from '../../services/queryAnalysisService';
import { AssistantType } from '../../prompts';

/**
 * Represents a single message exchange in a test flow
 */
export interface TestFlowMessage {
  message: string;                 // The message to send
  expectedAssistantType: AssistantType; // Expected assistant to respond
  expectedIntent?: IntentCategory; // Expected primary intent
  expectedEntities?: string[];     // Expected entity types to be detected
  expectedFunctionCalls?: string[]; // Function calls expected to be made
  dataValidation?: DataValidationRule[]; // Rules to validate data in response
  notes?: string;                  // Additional notes about this test step
}

/**
 * Represents a rule to validate data in a response
 */
export interface DataValidationRule {
  type: 'contains' | 'exact' | 'regex' | 'entityPresent' | 'dataStructure';
  target: 'text' | 'function' | 'structuredData';
  value: string | RegExp | object; // What to check for
  description: string;             // Human-readable description of this validation
}

/**
 * Represents a complete test flow (conversation)
 */
export interface TestFlow {
  id: string;                      // Unique identifier
  name: string;                    // Human-readable name
  description: string;             // Detailed description
  category: TestFlowCategory;      // Categorization of test
  tags: string[];                  // Additional tags for filtering
  steps: TestFlowMessage[];        // Steps in the conversation
  setup?: () => Promise<void>;     // Optional setup function
  teardown?: () => Promise<void>;  // Optional teardown function
}

/**
 * Categories of test flows
 */
export type TestFlowCategory = 
  | 'employee' 
  | 'talent' 
  | 'transition' 
  | 'error' 
  | 'ambiguous'
  | 'end-to-end'
  | 'performance';

/**
 * Results of a test flow execution
 */
export interface TestFlowResult {
  flowId: string;                  // ID of the test flow
  flowName: string;                // Name of the test flow
  successful: boolean;             // Overall success
  timestamp: Date;                 // When the test was run
  duration: number;                // Duration of the test in ms
  steps: TestStepResult[];         // Results for each step
  metrics: TestMetrics;            // Performance metrics
  errors?: string[];               // Any errors encountered
}

/**
 * Results of a single step in a test flow
 */
export interface TestStepResult {
  message: string;                         // Original message
  expectedAssistantType: AssistantType;    // Expected assistant
  actualAssistantType: AssistantType;      // Actual assistant that responded
  assistantTypeCorrect: boolean;           // Whether assistant type matched
  expectedIntent?: IntentCategory;         // Expected intent
  actualIntent?: IntentCategory;           // Actual intent detected
  intentCorrect?: boolean;                 // Whether intent matched
  expectedEntities?: string[];             // Expected entity types
  actualEntities?: DetectedEntity[];       // Actual entities detected
  entityDetectionCorrect?: boolean;        // Whether entity detection was correct
  expectedFunctionCalls?: string[];        // Expected function calls
  actualFunctionCalls?: string[];          // Actual function calls made
  functionCallsCorrect?: boolean;          // Whether function calls matched
  dataValidationResults?: DataValidationResult[]; // Results of data validation
  response?: Message;                      // Full response message
  duration: number;                        // Time taken for this step
  passed: boolean;                         // Overall step result
}

/**
 * Result of a data validation rule
 */
export interface DataValidationResult {
  rule: DataValidationRule;       // The original rule
  passed: boolean;                // Whether validation passed
  details?: string;               // Details about the validation result
}

/**
 * Test metrics for analysis and reporting
 */
export interface TestMetrics {
  overallSuccessRate: number;               // % of steps that passed
  assistantTypeAccuracy: number;           // % of assistant types correct
  intentClassificationAccuracy?: number;   // % of intents correct
  entityDetectionAccuracy?: number;        // % of entity detection correct
  functionCallAccuracy?: number;           // % of function calls correct
  dataValidationSuccessRate?: number;      // % of data validations passed
  averageResponseTime: number;             // Average response time in ms
  transitionSuccessRate?: number;          // % of transitions successful
  contextPreservationRate?: number;        // % of context preserved correctly
}

/**
 * Configuration options for test execution
 */
export interface TestExecutionOptions {
  timeout?: number;              // Timeout for each step in ms
  saveResults?: boolean;         // Whether to save results
  verbose?: boolean;             // Whether to log detailed results
  stopOnFailure?: boolean;       // Whether to stop on first failure
  categories?: TestFlowCategory[]; // Categories to run
  tags?: string[];               // Tags to filter by
  flowIds?: string[];            // Specific flow IDs to run
}

/**
 * Test report interface
 */
export interface TestReport {
  timestamp: Date;                // When the report was generated
  summary: {
    totalFlows: number;           // Total number of flows tested
    passedFlows: number;          // Number of passed flows
    failedFlows: number;          // Number of failed flows
    totalSteps: number;           // Total number of steps tested
    passedSteps: number;          // Number of passed steps
    failedSteps: number;          // Number of failed steps
    duration: number;             // Total duration in ms
  };
  metrics: TestMetrics;           // Aggregated metrics
  flowResults: TestFlowResult[];  // Results for each flow
  categories: {                   // Results by category
    [category in TestFlowCategory]?: {
      flows: number;
      passRate: number;
    }
  };
}