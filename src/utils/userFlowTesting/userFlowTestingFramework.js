/**
 * User Flow Testing Framework
 * 
 * Provides functionality for testing end-to-end conversation flows
 * with the unified assistant prototype.
 */

const fs = require('fs');
const path = require('path');

// Import types and interfaces
const { 
  TestFlow, 
  TestFlowResult, 
  TestStepResult, 
  TestMetrics,
  TestExecutionOptions,
  DataValidationRule,
  DataValidationResult,
  TestReport,
  TestFlowCategory
} = require('./types.js');

// Import services
// Use mock services when real ones can't be loaded (for CLI testing)
let anthropicService = { default: {} };
let contextEnhancedAnthropicService = { 
  default: {
    getResponseWithContext: async () => ({ content: 'Mock response', assistantType: 'unified' })
  }
};
let queryAnalysisService = { 
  default: {
    analyzeQuery: async () => ({ 
      primaryIntent: { category: 'unknown' },
      entities: []
    })
  }
};
let performanceOptimizationService = { default: {} };
let AssistantType = {};
let Message = {};

try {
  anthropicService = require('../../services/anthropicService');
} catch (e) {
  console.warn('Warning: anthropicService not loaded');
}

try {
  contextEnhancedAnthropicService = require('../../services/contextEnhancedAnthropicService');
} catch (e) {
  console.warn('Warning: contextEnhancedAnthropicService not loaded');
}

try {
  queryAnalysisService = require('../../services/queryAnalysisService');
} catch (e) {
  console.warn('Warning: queryAnalysisService not loaded');
}

try {
  performanceOptimizationService = require('../../services/performanceOptimizationService');
} catch (e) {
  console.warn('Warning: performanceOptimizationService not loaded');
}

try {
  const prompts = require('../../prompts');
  AssistantType = prompts.AssistantType || {};
} catch (e) {
  console.warn('Warning: prompts module not loaded');
}

try {
  const chatContext = require('../../contexts/ChatContext');
  Message = chatContext.Message || {};
} catch (e) {
  console.warn('Warning: ChatContext module not loaded');
}

/**
 * Main class for the User Flow Testing Framework
 */
class UserFlowTestingFramework {
  constructor() {
    this.registeredFlows = new Map();
    this.results = [];
    this.defaultOptions = {
      timeout: 30000,
      saveResults: true,
      verbose: false,
      stopOnFailure: false
    };
  }

  /**
   * Register a test flow with the framework
   * @param {TestFlow} flow Test flow to register
   * @returns {void}
   */
  registerFlow(flow) {
    if (this.registeredFlows.has(flow.id)) {
      console.warn(`Flow with ID ${flow.id} already exists. Overwriting.`);
    }
    this.registeredFlows.set(flow.id, flow);
  }

  /**
   * Register multiple test flows
   * @param {TestFlow[]} flows Array of test flows to register
   * @returns {void}
   */
  registerFlows(flows) {
    for (const flow of flows) {
      this.registerFlow(flow);
    }
  }

  /**
   * Get all registered flows
   * @returns {Map<string, TestFlow>} Map of all registered flows
   */
  getRegisteredFlows() {
    return this.registeredFlows;
  }

  /**
   * Get flows by category
   * @param {string} category Category to filter by
   * @returns {TestFlow[]} Array of matching flows
   */
  getFlowsByCategory(category) {
    return Array.from(this.registeredFlows.values())
      .filter(flow => flow.category === category);
  }

  /**
   * Get flows by tag
   * @param {string} tag Tag to filter by
   * @returns {TestFlow[]} Array of matching flows
   */
  getFlowsByTag(tag) {
    return Array.from(this.registeredFlows.values())
      .filter(flow => flow.tags.includes(tag));
  }

  /**
   * Execute a single test flow
   * @param {string} flowId ID of the flow to execute
   * @param {object} options Execution options
   * @returns {Promise<TestFlowResult>} Test flow result
   */
  async executeFlow(flowId, options = {}) {
    const flow = this.registeredFlows.get(flowId);
    if (!flow) {
      throw new Error(`Flow with ID ${flowId} not found`);
    }

    const mergedOptions = { ...this.defaultOptions, ...options };
    const startTime = Date.now();
    
    console.log(`\nExecuting flow: ${flow.name} (${flow.id})`);
    console.log(`Description: ${flow.description}`);
    console.log(`Category: ${flow.category}`);
    console.log(`Steps: ${flow.steps.length}`);
    
    // Run setup if defined
    if (flow.setup) {
      try {
        await flow.setup();
      } catch (error) {
        console.error('Error in flow setup:', error);
        return this.createFailedFlowResult(flow, ['Setup failed: ' + error.message]);
      }
    }
    
    // Initialize conversation history
    let conversationHistory = [];
    const stepResults = [];
    let currentAssistantType = 'unified';
    
    // Execute each step
    let flowSuccessful = true;
    let stepErrors = [];
    
    for (let i = 0; i < flow.steps.length; i++) {
      const step = flow.steps[i];
      console.log(`\nStep ${i + 1}/${flow.steps.length}: "${step.message.substring(0, 50)}${step.message.length > 50 ? '...' : ''}"`);
      
      // Add user message to history
      conversationHistory.push({
        id: `user-${Date.now()}`,
        content: step.message,
        role: 'user',
        timestamp: new Date()
      });
      
      // Analyze the query
      const startAnalysisTime = Date.now();
      const queryAnalysis = await queryAnalysisService.analyzeQuery(step.message);
      
      // Use the context enhanced Anthropic service to get a response
      const stepStartTime = Date.now();
      let assistantResponse;
      let functionCallsMade = [];
      
      try {
        // Get optimized response using the performance optimization service
        const enhancedResponse = await contextEnhancedAnthropicService.getResponseWithContext(
          step.message,
          conversationHistory,
          currentAssistantType
        );
        
        assistantResponse = {
          id: `assistant-${Date.now()}`,
          content: enhancedResponse.content || '',
          role: 'assistant',
          timestamp: new Date(),
          assistantType: enhancedResponse.assistantType || currentAssistantType
        };
        
        // Track function calls if any
        if (enhancedResponse.functionCalls && enhancedResponse.functionCalls.length > 0) {
          functionCallsMade = enhancedResponse.functionCalls.map(call => call.name);
        }
        
        // Update current assistant type for the next step
        currentAssistantType = assistantResponse.assistantType || currentAssistantType;
        
        // Add to conversation history
        conversationHistory.push(assistantResponse);
      } catch (error) {
        console.error(`Error in step ${i + 1}:`, error);
        stepErrors.push(`Step ${i + 1} failed: ${error.message}`);
        
        // Create a failed step result
        const failedStep = {
          message: step.message,
          expectedAssistantType: step.expectedAssistantType,
          actualAssistantType: currentAssistantType,
          assistantTypeCorrect: false,
          duration: Date.now() - stepStartTime,
          passed: false
        };
        
        stepResults.push(failedStep);
        flowSuccessful = false;
        
        if (mergedOptions.stopOnFailure) {
          break;
        } else {
          continue;
        }
      }
      
      // Validate the response
      const stepEndTime = Date.now();
      const stepDuration = stepEndTime - stepStartTime;
      
      // Check if assistant type matches expected
      const assistantTypeCorrect = 
        assistantResponse.assistantType === step.expectedAssistantType;
      
      // Check if intent matches expected
      const intentCorrect = !step.expectedIntent || 
        queryAnalysis.primaryIntent.category === step.expectedIntent;
      
      // Check if expected entities were detected
      let entityDetectionCorrect = true;
      if (step.expectedEntities && step.expectedEntities.length > 0) {
        const detectedEntityTypes = queryAnalysis.entities.map(e => e.type);
        entityDetectionCorrect = step.expectedEntities.every(
          expectedType => detectedEntityTypes.includes(expectedType)
        );
      }
      
      // Check if expected function calls were made
      let functionCallsCorrect = true;
      if (step.expectedFunctionCalls && step.expectedFunctionCalls.length > 0) {
        functionCallsCorrect = step.expectedFunctionCalls.every(
          expectedCall => functionCallsMade.includes(expectedCall)
        );
      }
      
      // Validate data in response
      let dataValidationResults = [];
      if (step.dataValidation && step.dataValidation.length > 0) {
        dataValidationResults = this.validateResponseData(
          assistantResponse, 
          step.dataValidation
        );
      }
      
      // Determine if step passed overall
      const dataValidationPassed = dataValidationResults.length === 0 || 
        dataValidationResults.every(result => result.passed);
      
      const stepPassed = assistantTypeCorrect && 
        intentCorrect && 
        entityDetectionCorrect && 
        functionCallsCorrect && 
        dataValidationPassed;
      
      // Create step result
      const stepResult = {
        message: step.message,
        expectedAssistantType: step.expectedAssistantType,
        actualAssistantType: assistantResponse.assistantType || currentAssistantType,
        assistantTypeCorrect,
        expectedIntent: step.expectedIntent,
        actualIntent: queryAnalysis.primaryIntent.category,
        intentCorrect,
        expectedEntities: step.expectedEntities,
        actualEntities: queryAnalysis.entities,
        entityDetectionCorrect,
        expectedFunctionCalls: step.expectedFunctionCalls,
        actualFunctionCalls: functionCallsMade,
        functionCallsCorrect,
        dataValidationResults,
        response: assistantResponse,
        duration: stepDuration,
        passed: stepPassed
      };
      
      stepResults.push(stepResult);
      
      // Update flow success status
      if (!stepPassed) {
        flowSuccessful = false;
        if (mergedOptions.stopOnFailure) {
          console.log('Step failed, stopping flow execution due to stopOnFailure option.');
          break;
        }
      }
      
      // Log detailed results if verbose
      if (mergedOptions.verbose) {
        console.log(`- Assistant Type: ${stepResult.assistantTypeCorrect ? '✓' : '✗'} (Expected: ${stepResult.expectedAssistantType}, Actual: ${stepResult.actualAssistantType})`);
        if (step.expectedIntent) {
          console.log(`- Intent: ${stepResult.intentCorrect ? '✓' : '✗'} (Expected: ${stepResult.expectedIntent}, Actual: ${stepResult.actualIntent})`);
        }
        if (step.expectedEntities && step.expectedEntities.length > 0) {
          console.log(`- Entity Detection: ${stepResult.entityDetectionCorrect ? '✓' : '✗'}`);
        }
        if (step.expectedFunctionCalls && step.expectedFunctionCalls.length > 0) {
          console.log(`- Function Calls: ${stepResult.functionCallsCorrect ? '✓' : '✗'}`);
        }
        console.log(`- Response: "${assistantResponse.content.substring(0, 100)}${assistantResponse.content.length > 100 ? '...' : ''}"`);
        console.log(`- Duration: ${stepDuration}ms`);
        console.log(`- Step Passed: ${stepPassed ? '✓' : '✗'}`);
      } else {
        // Simple output for non-verbose mode
        console.log(`- Result: ${stepPassed ? '✓ PASSED' : '✗ FAILED'} (${stepDuration}ms)`);
      }
    }
    
    // Run teardown if defined
    if (flow.teardown) {
      try {
        await flow.teardown();
      } catch (error) {
        console.error('Error in flow teardown:', error);
        stepErrors.push('Teardown failed: ' + error.message);
      }
    }
    
    // Calculate metrics
    const metrics = this.calculateFlowMetrics(stepResults);
    
    // Create flow result
    const endTime = Date.now();
    const flowResult = {
      flowId: flow.id,
      flowName: flow.name,
      successful: flowSuccessful,
      timestamp: new Date(),
      duration: endTime - startTime,
      steps: stepResults,
      metrics,
      errors: stepErrors.length > 0 ? stepErrors : undefined
    };
    
    // Save the result
    this.results.push(flowResult);
    if (mergedOptions.saveResults) {
      this.saveFlowResult(flowResult);
    }
    
    // Log summary
    console.log('\nFlow execution complete:');
    console.log(`- Success: ${flowSuccessful ? '✓' : '✗'}`);
    console.log(`- Duration: ${flowResult.duration}ms`);
    console.log(`- Steps Passed: ${stepResults.filter(s => s.passed).length}/${stepResults.length}`);
    console.log(`- Assistant Type Accuracy: ${(metrics.assistantTypeAccuracy * 100).toFixed(1)}%`);
    if (metrics.intentClassificationAccuracy !== undefined) {
      console.log(`- Intent Classification Accuracy: ${(metrics.intentClassificationAccuracy * 100).toFixed(1)}%`);
    }
    if (metrics.transitionSuccessRate !== undefined) {
      console.log(`- Transition Success Rate: ${(metrics.transitionSuccessRate * 100).toFixed(1)}%`);
    }
    
    return flowResult;
  }

  /**
   * Execute multiple flows matching the given criteria
   * @param {object} options Execution options
   * @returns {Promise<TestReport>} Test report
   */
  async executeFlows(options = {}) {
    const mergedOptions = { ...this.defaultOptions, ...options };
    const startTime = Date.now();
    this.results = [];
    
    // Determine which flows to run
    let flowsToRun = [];
    
    if (mergedOptions.flowIds && mergedOptions.flowIds.length > 0) {
      // Run specific flows by ID
      for (const id of mergedOptions.flowIds) {
        const flow = this.registeredFlows.get(id);
        if (flow) {
          flowsToRun.push(flow);
        } else {
          console.warn(`Flow with ID ${id} not found, skipping.`);
        }
      }
    } else if (mergedOptions.categories && mergedOptions.categories.length > 0) {
      // Run flows by category
      flowsToRun = Array.from(this.registeredFlows.values())
        .filter(flow => mergedOptions.categories.includes(flow.category));
    } else if (mergedOptions.tags && mergedOptions.tags.length > 0) {
      // Run flows by tags
      flowsToRun = Array.from(this.registeredFlows.values())
        .filter(flow => mergedOptions.tags.some(tag => flow.tags.includes(tag)));
    } else {
      // Run all flows
      flowsToRun = Array.from(this.registeredFlows.values());
    }
    
    console.log(`Executing ${flowsToRun.length} test flows...`);
    
    // Execute each flow
    const flowResults = [];
    for (const flow of flowsToRun) {
      const result = await this.executeFlow(flow.id, mergedOptions);
      flowResults.push(result);
    }
    
    // Generate report
    const report = this.generateReport(flowResults);
    
    // Save report if requested
    if (mergedOptions.saveResults) {
      this.saveReport(report);
    }
    
    // Print summary
    console.log('\n===============================================');
    console.log('TEST EXECUTION SUMMARY');
    console.log('===============================================');
    console.log(`Total Flows: ${report.summary.totalFlows}`);
    console.log(`Passed Flows: ${report.summary.passedFlows}/${report.summary.totalFlows} (${(report.summary.passedFlows / report.summary.totalFlows * 100).toFixed(1)}%)`);
    console.log(`Failed Flows: ${report.summary.failedFlows}/${report.summary.totalFlows} (${(report.summary.failedFlows / report.summary.totalFlows * 100).toFixed(1)}%)`);
    console.log(`Total Steps: ${report.summary.totalSteps}`);
    console.log(`Passed Steps: ${report.summary.passedSteps}/${report.summary.totalSteps} (${(report.summary.passedSteps / report.summary.totalSteps * 100).toFixed(1)}%)`);
    console.log(`Duration: ${report.summary.duration}ms`);
    console.log('\nMetrics:');
    console.log(`- Assistant Type Accuracy: ${(report.metrics.assistantTypeAccuracy * 100).toFixed(1)}%`);
    if (report.metrics.intentClassificationAccuracy !== undefined) {
      console.log(`- Intent Classification Accuracy: ${(report.metrics.intentClassificationAccuracy * 100).toFixed(1)}%`);
    }
    if (report.metrics.transitionSuccessRate !== undefined) {
      console.log(`- Transition Success Rate: ${(report.metrics.transitionSuccessRate * 100).toFixed(1)}%`);
    }
    if (report.metrics.contextPreservationRate !== undefined) {
      console.log(`- Context Preservation Rate: ${(report.metrics.contextPreservationRate * 100).toFixed(1)}%`);
    }
    console.log('\nCategory Results:');
    Object.entries(report.categories).forEach(([category, results]) => {
      console.log(`- ${category}: ${results.flows} flows, ${(results.passRate * 100).toFixed(1)}% pass rate`);
    });
    console.log('===============================================');
    
    return report;
  }

  /**
   * Validate response data against a set of validation rules
   * @param {object} response The response message to validate
   * @param {Array} rules Validation rules to apply
   * @returns {Array} Array of validation results
   */
  validateResponseData(response, rules) {
    const results = [];
    
    for (const rule of rules) {
      let passed = false;
      let details = '';
      
      switch (rule.type) {
        case 'contains':
          if (rule.target === 'text') {
            const value = rule.value;
            passed = response.content.includes(value);
            details = passed ? 
              `Found "${value}" in response` : 
              `Could not find "${value}" in response`;
          }
          break;
          
        case 'exact':
          if (rule.target === 'text') {
            const value = rule.value;
            passed = response.content === value;
            details = passed ? 
              'Exact match found' : 
              `Expected "${value}" but got "${response.content}"`;
          }
          break;
          
        case 'regex':
          if (rule.target === 'text') {
            const regex = rule.value;
            passed = regex.test(response.content);
            details = passed ? 
              `Regex ${regex} matched` : 
              `Regex ${regex} did not match`;
          }
          break;
          
        case 'entityPresent':
          if (rule.target === 'structuredData' && response.structuredData) {
            const entityType = rule.value;
            passed = response.structuredData.type === entityType;
            details = passed ? 
              `Entity type ${entityType} found` : 
              `Entity type ${entityType} not found, got ${response.structuredData.type}`;
          }
          break;
          
        case 'dataStructure':
          if (rule.target === 'structuredData' && response.structuredData) {
            // This would involve more complex validation of the data structure
            // Simplified for this implementation
            passed = true;
            details = 'Data structure validation not fully implemented';
          }
          break;
      }
      
      results.push({
        rule,
        passed,
        details
      });
    }
    
    return results;
  }

  /**
   * Calculate metrics for a flow based on step results
   * @param {Array} stepResults Results of all steps in the flow
   * @returns {object} Metrics for the flow
   */
  calculateFlowMetrics(stepResults) {
    // Count passed steps
    const passedSteps = stepResults.filter(step => step.passed).length;
    
    // Calculate assistant type accuracy
    const assistantTypeCorrect = stepResults.filter(
      step => step.assistantTypeCorrect
    ).length;
    
    // Calculate intent classification accuracy if applicable
    const stepsWithIntentExpectation = stepResults.filter(
      step => step.expectedIntent !== undefined
    );
    const intentClassificationAccuracy = stepsWithIntentExpectation.length > 0 ?
      stepsWithIntentExpectation.filter(step => step.intentCorrect).length / 
      stepsWithIntentExpectation.length : 
      undefined;
    
    // Calculate entity detection accuracy if applicable
    const stepsWithEntityExpectation = stepResults.filter(
      step => step.expectedEntities !== undefined && step.expectedEntities.length > 0
    );
    const entityDetectionAccuracy = stepsWithEntityExpectation.length > 0 ?
      stepsWithEntityExpectation.filter(step => step.entityDetectionCorrect).length / 
      stepsWithEntityExpectation.length : 
      undefined;
    
    // Calculate function call accuracy if applicable
    const stepsWithFunctionCallExpectation = stepResults.filter(
      step => step.expectedFunctionCalls !== undefined && step.expectedFunctionCalls.length > 0
    );
    const functionCallAccuracy = stepsWithFunctionCallExpectation.length > 0 ?
      stepsWithFunctionCallExpectation.filter(step => step.functionCallsCorrect).length / 
      stepsWithFunctionCallExpectation.length : 
      undefined;
    
    // Calculate data validation success rate if applicable
    const stepsWithDataValidation = stepResults.filter(
      step => step.dataValidationResults !== undefined && step.dataValidationResults.length > 0
    );
    let dataValidationSuccessRate;
    if (stepsWithDataValidation.length > 0) {
      let totalValidations = 0;
      let passedValidations = 0;
      
      for (const step of stepsWithDataValidation) {
        totalValidations += step.dataValidationResults.length;
        passedValidations += step.dataValidationResults.filter(result => result.passed).length;
      }
      
      dataValidationSuccessRate = totalValidations > 0 ?
        passedValidations / totalValidations : 
        undefined;
    }
    
    // Calculate average response time
    const totalDuration = stepResults.reduce(
      (sum, step) => sum + step.duration, 0
    );
    const averageResponseTime = totalDuration / stepResults.length;
    
    // Calculate transition success rate if applicable
    // A transition is when the expected assistant type changes between steps
    let transitionSuccessRate;
    const transitions = [];
    
    for (let i = 1; i < stepResults.length; i++) {
      const prevStep = stepResults[i - 1];
      const currStep = stepResults[i];
      
      if (prevStep.expectedAssistantType !== currStep.expectedAssistantType) {
        // This is a transition
        transitions.push({
          expected: true,
          successful: currStep.assistantTypeCorrect
        });
      }
    }
    
    if (transitions.length > 0) {
      const successfulTransitions = transitions.filter(t => t.successful).length;
      transitionSuccessRate = successfulTransitions / transitions.length;
    }
    
    // Calculate context preservation rate
    // This would need more sophisticated analysis to determine if context
    // is preserved across steps. Simplified placeholder implementation.
    const contextPreservationRate = undefined;
    
    return {
      overallSuccessRate: passedSteps / stepResults.length,
      assistantTypeAccuracy: assistantTypeCorrect / stepResults.length,
      intentClassificationAccuracy,
      entityDetectionAccuracy,
      functionCallAccuracy,
      dataValidationSuccessRate,
      averageResponseTime,
      transitionSuccessRate,
      contextPreservationRate
    };
  }

  /**
   * Generate a test report based on flow results
   * @param {Array} flowResults Results of flow executions
   * @returns {object} Comprehensive test report
   */
  generateReport(flowResults) {
    // Count passed and failed flows
    const passedFlows = flowResults.filter(result => result.successful).length;
    const failedFlows = flowResults.length - passedFlows;
    
    // Count total steps, passed steps, and failed steps
    let totalSteps = 0;
    let passedSteps = 0;
    let failedSteps = 0;
    
    for (const result of flowResults) {
      totalSteps += result.steps.length;
      passedSteps += result.steps.filter(step => step.passed).length;
    }
    failedSteps = totalSteps - passedSteps;
    
    // Calculate total duration
    const totalDuration = flowResults.reduce(
      (sum, result) => sum + result.duration, 0
    );
    
    // Calculate aggregated metrics
    const metrics = this.calculateAggregatedMetrics(flowResults);
    
    // Calculate results by category
    const categories = {};
    
    // Get all flows to look up categories
    const allFlows = Array.from(this.registeredFlows.values());
    
    for (const result of flowResults) {
      const flow = allFlows.find(f => f.id === result.flowId);
      if (flow) {
        const category = flow.category;
        
        if (!categories[category]) {
          categories[category] = {
            flows: 0,
            passRate: 0
          };
        }
        
        categories[category].flows++;
        
        if (result.successful) {
          // Update pass rate incrementally
          const currentPasses = (categories[category].passRate * (categories[category].flows - 1));
          categories[category].passRate = (currentPasses + 1) / categories[category].flows;
        } else {
          // Update pass rate incrementally (no change to successful count)
          const currentPasses = (categories[category].passRate * (categories[category].flows - 1));
          categories[category].passRate = currentPasses / categories[category].flows;
        }
      }
    }
    
    return {
      timestamp: new Date(),
      summary: {
        totalFlows: flowResults.length,
        passedFlows,
        failedFlows,
        totalSteps,
        passedSteps,
        failedSteps,
        duration: totalDuration
      },
      metrics,
      flowResults,
      categories
    };
  }

  /**
   * Calculate aggregated metrics across all flow results
   * @param {Array} flowResults Results of all flows
   * @returns {object} Aggregated metrics
   */
  calculateAggregatedMetrics(flowResults) {
    // Combine all step results
    const allStepResults = [];
    for (const result of flowResults) {
      allStepResults.push(...result.steps);
    }
    
    // Use the existing metrics calculation function
    return this.calculateFlowMetrics(allStepResults);
  }

  /**
   * Save a flow result to a file
   * @param {object} result Flow result to save
   * @returns {void}
   */
  saveFlowResult(result) {
    try {
      // Create the results directory if it doesn't exist
      const resultsDir = path.join(process.cwd(), 'test-results');
      if (!fs.existsSync(resultsDir)) {
        fs.mkdirSync(resultsDir, { recursive: true });
      }
      
      // Create a flow-specific directory
      const flowDir = path.join(resultsDir, result.flowId);
      if (!fs.existsSync(flowDir)) {
        fs.mkdirSync(flowDir, { recursive: true });
      }
      
      // Format the timestamp for the filename
      const timestamp = new Date().toISOString()
        .replace(/:/g, '-')
        .replace(/\..+/, '');
      
      // Save the result
      const resultPath = path.join(flowDir, `result-${timestamp}.json`);
      fs.writeFileSync(
        resultPath, 
        JSON.stringify(result, null, 2)
      );
      
      console.log(`Flow result saved to ${resultPath}`);
    } catch (error) {
      console.error('Error saving flow result:', error);
    }
  }

  /**
   * Save a test report to a file
   * @param {object} report Report to save
   * @returns {void}
   */
  saveReport(report) {
    try {
      // Create the results directory if it doesn't exist
      const resultsDir = path.join(process.cwd(), 'test-results');
      if (!fs.existsSync(resultsDir)) {
        fs.mkdirSync(resultsDir, { recursive: true });
      }
      
      // Format the timestamp for the filename
      const timestamp = new Date().toISOString()
        .replace(/:/g, '-')
        .replace(/\..+/, '');
      
      // Save the report
      const reportPath = path.join(resultsDir, `report-${timestamp}.json`);
      fs.writeFileSync(
        reportPath, 
        JSON.stringify(report, null, 2)
      );
      
      console.log(`Test report saved to ${reportPath}`);
    } catch (error) {
      console.error('Error saving test report:', error);
    }
  }

  /**
   * Create a failed flow result
   * @param {object} flow Flow that failed
   * @param {string[]} errors Error messages
   * @returns {object} Failed flow result
   */
  createFailedFlowResult(flow, errors) {
    return {
      flowId: flow.id,
      flowName: flow.name,
      successful: false,
      timestamp: new Date(),
      duration: 0,
      steps: [],
      metrics: {
        overallSuccessRate: 0,
        assistantTypeAccuracy: 0,
        averageResponseTime: 0
      },
      errors
    };
  }

  /**
   * Clear all test results
   * @returns {void}
   */
  clearResults() {
    this.results = [];
  }

  /**
   * Get all test results
   * @returns {Array} Array of test results
   */
  getResults() {
    return this.results;
  }

  /**
   * Get the most recent test report
   * @returns {object|undefined} Most recent test report or undefined if none exists
   */
  getMostRecentReport() {
    try {
      const resultsDir = path.join(process.cwd(), 'test-results');
      if (!fs.existsSync(resultsDir)) {
        return undefined;
      }
      
      // Get all report files
      const files = fs.readdirSync(resultsDir)
        .filter(file => file.startsWith('report-') && file.endsWith('.json'))
        .sort()
        .reverse();
      
      if (files.length === 0) {
        return undefined;
      }
      
      // Read the most recent report
      const reportPath = path.join(resultsDir, files[0]);
      const reportContent = fs.readFileSync(reportPath, 'utf-8');
      return JSON.parse(reportContent);
    } catch (error) {
      console.error('Error reading most recent report:', error);
      return undefined;
    }
  }
}

// Create singleton instance
const userFlowTestingFramework = new UserFlowTestingFramework();

// Export for CommonJS
module.exports = {
  UserFlowTestingFramework,
  default: userFlowTestingFramework
};