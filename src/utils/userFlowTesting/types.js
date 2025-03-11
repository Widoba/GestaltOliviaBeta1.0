/**
 * Types and interfaces for the User Flow Testing Framework
 */

// Import using require for CommonJS compatibility
// Use empty objects as fallbacks if modules can't be loaded (for CLI testing)
let Message = {};
let DetectedEntity = {};
let IntentCategory = {};
let AssistantType = {};

try {
  const chatContext = require('../../contexts/ChatContext');
  Message = chatContext.Message || {};
} catch (e) {
  console.warn('Warning: ChatContext module not loaded');
}

try {
  const queryAnalysisService = require('../../services/queryAnalysisService');
  DetectedEntity = queryAnalysisService.DetectedEntity || {};
  IntentCategory = queryAnalysisService.IntentCategory || {};
} catch (e) {
  console.warn('Warning: queryAnalysisService module not loaded');
}

try {
  const prompts = require('../../prompts');
  AssistantType = prompts.AssistantType || {};
} catch (e) {
  console.warn('Warning: prompts module not loaded');
}

// Define all interfaces as standard JS objects/classes to work with CommonJS

/**
 * Represents a single message exchange in a test flow
 */
class TestFlowMessage {
  /**
   * @param {string} message - The message to send
   * @param {string} expectedAssistantType - Expected assistant to respond
   * @param {string} [expectedIntent] - Expected primary intent
   * @param {string[]} [expectedEntities] - Expected entity types to be detected
   * @param {string[]} [expectedFunctionCalls] - Function calls expected to be made
   * @param {Array<{type: string, target: string, value: any, description: string}>} [dataValidation] - Rules to validate data in response
   * @param {string} [notes] - Additional notes about this test step
   */
  constructor(message, expectedAssistantType, expectedIntent, expectedEntities, expectedFunctionCalls, dataValidation, notes) {
    this.message = message;
    this.expectedAssistantType = expectedAssistantType;
    this.expectedIntent = expectedIntent;
    this.expectedEntities = expectedEntities;
    this.expectedFunctionCalls = expectedFunctionCalls;
    this.dataValidation = dataValidation;
    this.notes = notes;
  }
}

/**
 * Represents a rule to validate data in a response
 */
class DataValidationRule {
  /**
   * @param {('contains'|'exact'|'regex'|'entityPresent'|'dataStructure')} type - Type of validation
   * @param {('text'|'function'|'structuredData')} target - Target to validate
   * @param {string|RegExp|object} value - What to check for
   * @param {string} description - Human-readable description of this validation
   */
  constructor(type, target, value, description) {
    this.type = type;
    this.target = target;
    this.value = value;
    this.description = description;
  }
}

/**
 * Represents a complete test flow (conversation)
 */
class TestFlow {
  /**
   * @param {string} id - Unique identifier
   * @param {string} name - Human-readable name
   * @param {string} description - Detailed description
   * @param {string} category - Categorization of test
   * @param {string[]} tags - Additional tags for filtering
   * @param {TestFlowMessage[]} steps - Steps in the conversation
   * @param {Function} [setup] - Optional setup function
   * @param {Function} [teardown] - Optional teardown function
   */
  constructor(id, name, description, category, tags, steps, setup, teardown) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.category = category;
    this.tags = tags;
    this.steps = steps;
    this.setup = setup;
    this.teardown = teardown;
  }
}

/**
 * Categories of test flows
 * @type {string[]}
 */
const TEST_FLOW_CATEGORIES = [
  'employee',
  'talent',
  'transition',
  'error',
  'ambiguous',
  'end-to-end',
  'performance'
];

/**
 * Results of a test flow execution
 */
class TestFlowResult {
  /**
   * @param {string} flowId - ID of the test flow
   * @param {string} flowName - Name of the test flow
   * @param {boolean} successful - Overall success
   * @param {Date} timestamp - When the test was run
   * @param {number} duration - Duration of the test in ms
   * @param {TestStepResult[]} steps - Results for each step
   * @param {object} metrics - Performance metrics
   * @param {string[]} [errors] - Any errors encountered
   */
  constructor(flowId, flowName, successful, timestamp, duration, steps, metrics, errors) {
    this.flowId = flowId;
    this.flowName = flowName;
    this.successful = successful;
    this.timestamp = timestamp;
    this.duration = duration;
    this.steps = steps;
    this.metrics = metrics;
    this.errors = errors;
  }
}

/**
 * Results of a single step in a test flow
 */
class TestStepResult {
  /**
   * @param {string} message - Original message
   * @param {string} expectedAssistantType - Expected assistant
   * @param {string} actualAssistantType - Actual assistant that responded
   * @param {boolean} assistantTypeCorrect - Whether assistant type matched
   * @param {string} [expectedIntent] - Expected intent
   * @param {string} [actualIntent] - Actual intent detected
   * @param {boolean} [intentCorrect] - Whether intent matched
   * @param {string[]} [expectedEntities] - Expected entity types
   * @param {object[]} [actualEntities] - Actual entities detected
   * @param {boolean} [entityDetectionCorrect] - Whether entity detection was correct
   * @param {string[]} [expectedFunctionCalls] - Expected function calls
   * @param {string[]} [actualFunctionCalls] - Actual function calls made
   * @param {boolean} [functionCallsCorrect] - Whether function calls matched
   * @param {DataValidationResult[]} [dataValidationResults] - Results of data validation
   * @param {object} [response] - Full response message
   * @param {number} duration - Time taken for this step
   * @param {boolean} passed - Overall step result
   */
  constructor(params) {
    Object.assign(this, params);
  }
}

/**
 * Result of a data validation rule
 */
class DataValidationResult {
  /**
   * @param {DataValidationRule} rule - The original rule
   * @param {boolean} passed - Whether validation passed
   * @param {string} [details] - Details about the validation result
   */
  constructor(rule, passed, details) {
    this.rule = rule;
    this.passed = passed;
    this.details = details;
  }
}

/**
 * Test metrics for analysis and reporting
 */
class TestMetrics {
  /**
   * @param {number} overallSuccessRate - % of steps that passed
   * @param {number} assistantTypeAccuracy - % of assistant types correct
   * @param {number} [intentClassificationAccuracy] - % of intents correct
   * @param {number} [entityDetectionAccuracy] - % of entity detection correct
   * @param {number} [functionCallAccuracy] - % of function calls correct
   * @param {number} [dataValidationSuccessRate] - % of data validations passed
   * @param {number} averageResponseTime - Average response time in ms
   * @param {number} [transitionSuccessRate] - % of transitions successful
   * @param {number} [contextPreservationRate] - % of context preserved correctly
   */
  constructor(overallSuccessRate, assistantTypeAccuracy, averageResponseTime, options = {}) {
    this.overallSuccessRate = overallSuccessRate;
    this.assistantTypeAccuracy = assistantTypeAccuracy;
    this.averageResponseTime = averageResponseTime;
    
    // Optional metrics
    if (options.intentClassificationAccuracy !== undefined) {
      this.intentClassificationAccuracy = options.intentClassificationAccuracy;
    }
    if (options.entityDetectionAccuracy !== undefined) {
      this.entityDetectionAccuracy = options.entityDetectionAccuracy;
    }
    if (options.functionCallAccuracy !== undefined) {
      this.functionCallAccuracy = options.functionCallAccuracy;
    }
    if (options.dataValidationSuccessRate !== undefined) {
      this.dataValidationSuccessRate = options.dataValidationSuccessRate;
    }
    if (options.transitionSuccessRate !== undefined) {
      this.transitionSuccessRate = options.transitionSuccessRate;
    }
    if (options.contextPreservationRate !== undefined) {
      this.contextPreservationRate = options.contextPreservationRate;
    }
  }
}

/**
 * Configuration options for test execution
 */
class TestExecutionOptions {
  /**
   * @param {boolean} [verbose=false] - Whether to log detailed results
   * @param {boolean} [saveResults=true] - Whether to save results
   * @param {boolean} [stopOnFailure=false] - Whether to stop on first failure
   * @param {number} [timeout=30000] - Timeout for each step in ms
   * @param {string[]} [categories] - Categories to run
   * @param {string[]} [tags] - Tags to filter by
   * @param {string[]} [flowIds] - Specific flow IDs to run
   */
  constructor({
    verbose = false,
    saveResults = true,
    stopOnFailure = false,
    timeout = 30000,
    categories,
    tags,
    flowIds
  } = {}) {
    this.verbose = verbose;
    this.saveResults = saveResults;
    this.stopOnFailure = stopOnFailure;
    this.timeout = timeout;
    
    if (categories) this.categories = categories;
    if (tags) this.tags = tags;
    if (flowIds) this.flowIds = flowIds;
  }
}

/**
 * Test report interface
 */
class TestReport {
  /**
   * @param {Date} timestamp - When the report was generated
   * @param {object} summary - Summary statistics
   * @param {TestMetrics} metrics - Aggregated metrics
   * @param {TestFlowResult[]} flowResults - Results for each flow
   * @param {object} categories - Results by category
   */
  constructor(timestamp, summary, metrics, flowResults, categories) {
    this.timestamp = timestamp;
    this.summary = summary;
    this.metrics = metrics;
    this.flowResults = flowResults;
    this.categories = categories;
  }
}

// Export all types for CommonJS
module.exports = {
  TestFlowMessage,
  DataValidationRule,
  TestFlow,
  TestFlowCategory: TEST_FLOW_CATEGORIES,
  TestFlowResult,
  TestStepResult,
  DataValidationResult,
  TestMetrics,
  TestExecutionOptions,
  TestReport
};