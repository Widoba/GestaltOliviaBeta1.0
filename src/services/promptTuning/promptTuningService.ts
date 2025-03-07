/**
 * Prompt Tuning Service
 * 
 * Service for running tests and evaluating prompt performance
 */
import {
  runPromptTests,
  comparePromptVariations,
  PromptPerformanceMetrics,
  TestCaseResult,
  PromptComparisonResult
} from '../../utils/promptTesting/promptTestingFramework';
import { 
  allTestCases,
  employeeBasicTestCases,
  talentBasicTestCases,
  edgeCaseTestCases,
  ambiguousTestCases,
  contextDependentTestCases
} from '../../utils/promptTesting/testCases';
import promptVariationManager, { PromptVariation } from './promptVariationManager';

// Interface for test run results
export interface TestRunResult {
  variationId: string;
  variationName: string;
  testResults: TestCaseResult[];
  metrics: PromptPerformanceMetrics;
  timestamp: Date;
}

// Interface for comparison results
export interface ComparisonResult {
  baselineId: string;
  testVariationId: string;
  comparison: PromptComparisonResult;
  timestamp: Date;
}

/**
 * Service for prompt tuning
 */
class PromptTuningService {
  private testResults: Map<string, TestRunResult> = new Map();
  private comparisons: Map<string, ComparisonResult> = new Map();
  
  /**
   * Run tests for a specific prompt variation
   * @param variationId ID of the variation to test
   * @param testCaseIds Optional array of specific test case IDs to run (default: all)
   * @returns Test results
   */
  async runTests(
    variationId: string,
    testCaseIds?: string[]
  ): Promise<TestRunResult> {
    // Get the prompt variation
    const variation = promptVariationManager.getVariation(variationId);
    if (!variation) {
      throw new Error(`Prompt variation with ID ${variationId} not found`);
    }
    
    // Determine which test cases to run
    let testCases = allTestCases;
    if (testCaseIds && testCaseIds.length > 0) {
      testCases = allTestCases.filter(tc => testCaseIds.includes(tc.id));
      if (testCases.length === 0) {
        throw new Error('No matching test cases found');
      }
    }
    
    // Run the tests
    const results = await runPromptTests(
      variation.name,
      variation.basePrompt, // Use base prompt for testing
      testCases
    );
    
    // Create and store the test run result
    const testRunResult: TestRunResult = {
      variationId,
      variationName: variation.name,
      testResults: results.testResults,
      metrics: results.metrics,
      timestamp: new Date()
    };
    
    // Store the results
    this.testResults.set(variationId, testRunResult);
    
    return testRunResult;
  }
  
  /**
   * Compare a test variation against the baseline
   * @param testVariationId ID of the test variation
   * @returns Comparison results
   */
  async compareWithBaseline(testVariationId: string): Promise<ComparisonResult> {
    // Get baseline results (run if not already run)
    let baselineResults = this.testResults.get('baseline');
    if (!baselineResults) {
      baselineResults = await this.runTests('baseline');
    }
    
    // Get test variation results (run if not already run)
    let testResults = this.testResults.get(testVariationId);
    if (!testResults) {
      testResults = await this.runTests(testVariationId);
    }
    
    // Get the variations
    const baseline = promptVariationManager.getVariation('baseline');
    const testVariation = promptVariationManager.getVariation(testVariationId);
    
    if (!baseline || !testVariation) {
      throw new Error('Baseline or test variation not found');
    }
    
    // Compare the results
    const comparison = comparePromptVariations(
      baseline.name,
      baselineResults.metrics,
      testVariation.name,
      testResults.metrics
    );
    
    // Create and store the comparison result
    const comparisonResult: ComparisonResult = {
      baselineId: 'baseline',
      testVariationId,
      comparison,
      timestamp: new Date()
    };
    
    // Generate a key for the comparison
    const comparisonKey = `baseline_vs_${testVariationId}`;
    this.comparisons.set(comparisonKey, comparisonResult);
    
    return comparisonResult;
  }
  
  /**
   * Run tests for all variations
   * @returns Map of variation IDs to test results
   */
  async runAllTests(): Promise<Map<string, TestRunResult>> {
    // Get all variations
    const variations = promptVariationManager.getAllVariations();
    
    // Run tests for each variation
    for (const variation of variations) {
      await this.runTests(variation.id);
    }
    
    return this.testResults;
  }
  
  /**
   * Compare all variations with the baseline
   * @returns Map of comparison keys to comparison results
   */
  async compareAllVariations(): Promise<Map<string, ComparisonResult>> {
    // Get all variations
    const variations = promptVariationManager.getAllVariations();
    
    // Skip the baseline in comparisons
    const testVariations = variations.filter(v => v.id !== 'baseline');
    
    // Compare each test variation with the baseline
    for (const variation of testVariations) {
      await this.compareWithBaseline(variation.id);
    }
    
    return this.comparisons;
  }
  
  /**
   * Run category-specific tests on a variation
   * @param variationId Variation ID
   * @param category Test case category
   * @returns Test results for the category
   */
  async runCategoryTests(
    variationId: string,
    category: 'basic' | 'edge' | 'ambiguous' | 'context-dependent'
  ): Promise<TestRunResult> {
    // Get the appropriate test cases
    let testCases;
    switch (category) {
      case 'basic':
        testCases = [...employeeBasicTestCases, ...talentBasicTestCases];
        break;
      case 'edge':
        testCases = edgeCaseTestCases;
        break;
      case 'ambiguous':
        testCases = ambiguousTestCases;
        break;
      case 'context-dependent':
        testCases = contextDependentTestCases;
        break;
    }
    
    // Get the test case IDs
    const testCaseIds = testCases.map(tc => tc.id);
    
    // Run tests with these specific test cases
    return this.runTests(variationId, testCaseIds);
  }
  
  /**
   * Get the best performing variation based on a specific metric
   * @param metric Metric to optimize for
   * @returns The best variation ID and its score
   */
  async getBestVariation(
    metric: keyof PromptPerformanceMetrics = 'overallScore'
  ): Promise<{ variationId: string; variationName: string; score: number }> {
    // Make sure all variations have been tested
    await this.runAllTests();
    
    // Find the best performing variation
    let bestVariationId = 'baseline';
    let bestScore = this.testResults.get('baseline')?.metrics[metric] || 0;
    let bestName = 'Current Production Prompts';
    
    for (const [id, result] of this.testResults.entries()) {
      if (id !== 'baseline' && result.metrics[metric] > bestScore) {
        bestVariationId = id;
        bestScore = result.metrics[metric];
        bestName = result.variationName;
      }
    }
    
    return {
      variationId: bestVariationId,
      variationName: bestName,
      score: bestScore
    };
  }
  
  /**
   * Clear all test results
   */
  clearTestResults(): void {
    this.testResults.clear();
    this.comparisons.clear();
  }
  
  /**
   * Get test results for a specific variation
   * @param variationId Variation ID
   * @returns Test results or undefined if not found
   */
  getTestResults(variationId: string): TestRunResult | undefined {
    return this.testResults.get(variationId);
  }
  
  /**
   * Create an optimized prompt variation by combining the best aspects
   * of existing variations
   */
  async createOptimizedPrompt(): Promise<PromptVariation> {
    // Run all tests to ensure we have metrics
    await this.runAllTests();
    
    // Get the best variation for each key metric
    const bestForIntentAccuracy = await this.getBestVariation('intentAccuracy');
    const bestForAssistantTypeAccuracy = await this.getBestVariation('assistantTypeAccuracy');
    const bestForTransitions = await this.getBestVariation('transitionSmoothnessScore');
    const bestForContextPreservation = await this.getBestVariation('contextPreservationScore');
    
    // Get the variations
    const bestIntentVar = promptVariationManager.getVariation(bestForIntentAccuracy.variationId);
    const bestAssistantVar = promptVariationManager.getVariation(bestForAssistantTypeAccuracy.variationId);
    const bestTransitionVar = promptVariationManager.getVariation(bestForTransitions.variationId);
    const bestContextVar = promptVariationManager.getVariation(bestForContextPreservation.variationId);
    
    if (!bestIntentVar || !bestAssistantVar || !bestTransitionVar || !bestContextVar) {
      throw new Error('Could not find all best variations');
    }
    
    // Build optimized prompt
    // Start with the baseline prompt
    let optimizedBasePrompt = promptVariationManager.getBaseline().basePrompt;
    
    // Extract improved intent classification section if it's not from baseline
    if (bestIntentVar.id !== 'baseline') {
      const intentClassificationStart = bestIntentVar.basePrompt.indexOf('### Classification Heuristics:');
      const intentClassificationEnd = bestIntentVar.basePrompt.indexOf('## DATA SCHEMAS AND RELATIONSHIPS', intentClassificationStart);
      
      if (intentClassificationStart !== -1 && intentClassificationEnd !== -1) {
        const intentClassificationSection = bestIntentVar.basePrompt.substring(
          intentClassificationStart,
          intentClassificationEnd
        );
        
        // Replace the section in the optimized prompt
        const originalStart = optimizedBasePrompt.indexOf('### Classification Heuristics:');
        const originalEnd = optimizedBasePrompt.indexOf('## DATA SCHEMAS AND RELATIONSHIPS', originalStart);
        
        if (originalStart !== -1 && originalEnd !== -1) {
          optimizedBasePrompt = optimizedBasePrompt.substring(0, originalStart) +
            intentClassificationSection +
            optimizedBasePrompt.substring(originalEnd);
        }
      }
    }
    
    // Extract improved transition handling section if it's not from baseline
    if (bestTransitionVar.id !== 'baseline') {
      const transitionStart = bestTransitionVar.basePrompt.indexOf('## TRANSITION HANDLING');
      const transitionEnd = bestTransitionVar.basePrompt.indexOf('## GENERAL BEHAVIOR GUIDELINES', transitionStart);
      
      if (transitionStart !== -1 && transitionEnd !== -1) {
        const transitionSection = bestTransitionVar.basePrompt.substring(
          transitionStart,
          transitionEnd
        );
        
        // Replace the section in the optimized prompt
        const originalStart = optimizedBasePrompt.indexOf('## TRANSITION HANDLING');
        const originalEnd = optimizedBasePrompt.indexOf('## GENERAL BEHAVIOR GUIDELINES', originalStart);
        
        if (originalStart !== -1 && originalEnd !== -1) {
          optimizedBasePrompt = optimizedBasePrompt.substring(0, originalStart) +
            transitionSection +
            optimizedBasePrompt.substring(originalEnd);
        }
      }
    }
    
    // Add context preservation section if the best is not from baseline
    if (bestContextVar.id !== 'baseline') {
      // Check if the optimized prompt already has this section
      if (!optimizedBasePrompt.includes('## CONVERSATION CONTEXT PRESERVATION')) {
        // Extract the section from the best context preservation variation
        const contextStart = bestContextVar.basePrompt.indexOf('## CONVERSATION CONTEXT PRESERVATION');
        if (contextStart !== -1) {
          const contextSection = bestContextVar.basePrompt.substring(contextStart);
          // Add at the end of the optimized prompt
          optimizedBasePrompt += `\n\n${contextSection}`;
        }
      }
    }
    
    // Create a new optimized variation
    const changes = [
      bestIntentVar.id !== 'baseline' ? `Intent classification from "${bestIntentVar.name}"` : '',
      bestAssistantVar.id !== 'baseline' ? `Assistant type detection from "${bestAssistantVar.name}"` : '',
      bestTransitionVar.id !== 'baseline' ? `Transition handling from "${bestTransitionVar.name}"` : '',
      bestContextVar.id !== 'baseline' ? `Context preservation from "${bestContextVar.name}"` : ''
    ].filter(Boolean); // Remove empty strings
    
    // Create the optimized variation
    return promptVariationManager.createVariation(
      'Optimized Combined Prompt',
      'Combined prompt taking the best aspects from all variations',
      optimizedBasePrompt,
      promptVariationManager.getBaseline().employeePrompt, // Use baseline prompts for now
      promptVariationManager.getBaseline().talentPrompt, // Use baseline prompts for now
      changes
    );
  }
}

// Export a singleton instance
const promptTuningService = new PromptTuningService();
export default promptTuningService;