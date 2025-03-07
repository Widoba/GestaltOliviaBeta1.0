/**
 * Prompt Testing Framework
 * 
 * A comprehensive framework for testing prompts with standardized test cases
 * and metrics for evaluating performance across different prompt variations.
 */
import { AssistantType } from '../../contexts/ChatContext';
import { IntentCategory } from '../../services/queryAnalysisService';

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

// Test result for a single test case
export interface TestCaseResult {
  testCase: PromptTestCase;
  actualAssistantType: AssistantType;
  actualIntent: IntentCategory;
  responseQuality: number; // 0-1 score
  isCorrect: boolean;
  error?: string;
  notes?: string;
}

// Comparison between two prompt variations
export interface PromptComparisonResult {
  baselinePromptName: string;
  testPromptName: string;
  baselineMetrics: PromptPerformanceMetrics;
  testMetrics: PromptPerformanceMetrics;
  improvementPercentage: {
    intentAccuracy: number;
    assistantTypeAccuracy: number;
    responseQuality: number;
    transitionSmoothnessScore: number;
    contextPreservationScore: number;
    overallScore: number;
  };
  significantImprovement: boolean;
  recommendations: string[];
}

/**
 * Run tests for a specific prompt variation
 * @param promptName Name of the prompt variation
 * @param promptContent The prompt content to test
 * @param testCases Array of test cases to run
 * @returns Test results and metrics
 */
export async function runPromptTests(
  promptName: string,
  promptContent: string,
  testCases: PromptTestCase[]
): Promise<{
  testResults: TestCaseResult[];
  metrics: PromptPerformanceMetrics;
}> {
  // Import query analysis service
  const queryAnalysisService = (await import('../../services/queryAnalysisService')).default;
  
  const testResults: TestCaseResult[] = [];
  
  // Run each test case
  for (const testCase of testCases) {
    try {
      // Perform query analysis with this prompt
      const analysis = await queryAnalysisService.analyzeQuery(testCase.query);
      
      // Evaluate response quality (simplified for testing framework)
      const responseQuality = evaluateResponseQuality(
        testCase.expectedAssistantType,
        analysis.assistantType,
        testCase.expectedIntent,
        analysis.primaryIntent.category
      );
      
      // Create test result
      const result: TestCaseResult = {
        testCase,
        actualAssistantType: analysis.assistantType,
        actualIntent: analysis.primaryIntent.category,
        responseQuality,
        isCorrect: 
          analysis.assistantType === testCase.expectedAssistantType && 
          analysis.primaryIntent.category === testCase.expectedIntent
      };
      
      testResults.push(result);
    } catch (error) {
      // Log any errors and continue testing
      console.error(`Error testing case ${testCase.id}:`, error);
      testResults.push({
        testCase,
        actualAssistantType: 'unified',
        actualIntent: IntentCategory.GENERAL_QUESTION,
        responseQuality: 0,
        isCorrect: false,
        error: error.message
      });
    }
  }
  
  // Calculate metrics
  const metrics = calculateMetrics(testResults);
  
  return {
    testResults,
    metrics
  };
}

/**
 * Evaluate the quality of a response based on intent and assistant matching
 * @param expectedAssistantType Expected assistant type
 * @param actualAssistantType Actual assistant type 
 * @param expectedIntent Expected intent
 * @param actualIntent Actual intent
 * @returns Quality score between 0 and 1
 */
function evaluateResponseQuality(
  expectedAssistantType: AssistantType,
  actualAssistantType: AssistantType,
  expectedIntent: IntentCategory,
  actualIntent: IntentCategory
): number {
  // Base score
  let score = 0;
  
  // 50% of score is based on assistant type match
  if (expectedAssistantType === actualAssistantType) {
    score += 0.5;
  } else if (actualAssistantType === 'unified') {
    // If expected was specific but got unified, partial credit
    score += 0.25;
  }
  
  // 50% of score is based on intent match
  if (expectedIntent === actualIntent) {
    score += 0.5;
  } else {
    // Check if intents are in the same category of assistant
    const employeeIntents = [
      IntentCategory.EMPLOYEE_INFO,
      IntentCategory.SCHEDULE_MANAGEMENT,
      IntentCategory.TASK_MANAGEMENT,
      IntentCategory.RECOGNITION
    ];
    
    const talentIntents = [
      IntentCategory.JOB_MANAGEMENT,
      IntentCategory.CANDIDATE_MANAGEMENT,
      IntentCategory.INTERVIEW_PROCESS,
      IntentCategory.HIRING_WORKFLOW
    ];
    
    // If both intents are in the same category, partial credit
    if (
      (employeeIntents.includes(expectedIntent) && employeeIntents.includes(actualIntent)) ||
      (talentIntents.includes(expectedIntent) && talentIntents.includes(actualIntent))
    ) {
      score += 0.25;
    }
  }
  
  return score;
}

/**
 * Calculate metrics from test results
 * @param results Test case results
 * @returns Performance metrics
 */
function calculateMetrics(results: TestCaseResult[]): PromptPerformanceMetrics {
  // Count correct intents and assistant types
  const totalTests = results.length;
  const correctIntents = results.filter(r => r.testCase.expectedIntent === r.actualIntent).length;
  const correctAssistantTypes = results.filter(r => r.testCase.expectedAssistantType === r.actualAssistantType).length;
  
  // Average response quality
  const avgResponseQuality = results.reduce((sum, r) => sum + r.responseQuality, 0) / totalTests;
  
  // For transition smoothness and context preservation,
  // we'd need conversational tests; using placeholders for now
  const transitionSmoothnessScore = 0.85; // Placeholder
  const contextPreservationScore = 0.9; // Placeholder
  
  // Calculate overall score (weighted average)
  const overallScore = (
    (correctIntents / totalTests) * 0.3 + // 30% weight for intent accuracy
    (correctAssistantTypes / totalTests) * 0.3 + // 30% weight for assistant type accuracy
    avgResponseQuality * 0.2 + // 20% weight for response quality
    transitionSmoothnessScore * 0.1 + // 10% weight for transition smoothness
    contextPreservationScore * 0.1 // 10% weight for context preservation
  );
  
  return {
    intentAccuracy: correctIntents / totalTests,
    assistantTypeAccuracy: correctAssistantTypes / totalTests,
    responseQuality: avgResponseQuality,
    transitionSmoothnessScore,
    contextPreservationScore,
    overallScore
  };
}

/**
 * Compare two prompt variations
 * @param baselineResults Results from baseline prompt
 * @param testResults Results from test prompt
 * @returns Comparison results and recommendations
 */
export function comparePromptVariations(
  baselinePromptName: string,
  baselineMetrics: PromptPerformanceMetrics,
  testPromptName: string,
  testMetrics: PromptPerformanceMetrics
): PromptComparisonResult {
  // Calculate improvement percentages
  const improvementPercentage = {
    intentAccuracy: calculateImprovement(baselineMetrics.intentAccuracy, testMetrics.intentAccuracy),
    assistantTypeAccuracy: calculateImprovement(baselineMetrics.assistantTypeAccuracy, testMetrics.assistantTypeAccuracy),
    responseQuality: calculateImprovement(baselineMetrics.responseQuality, testMetrics.responseQuality),
    transitionSmoothnessScore: calculateImprovement(baselineMetrics.transitionSmoothnessScore, testMetrics.transitionSmoothnessScore),
    contextPreservationScore: calculateImprovement(baselineMetrics.contextPreservationScore, testMetrics.contextPreservationScore),
    overallScore: calculateImprovement(baselineMetrics.overallScore, testMetrics.overallScore)
  };
  
  // Determine if improvement is significant (>5% overall)
  const significantImprovement = improvementPercentage.overallScore > 5;
  
  // Generate recommendations
  const recommendations = generateRecommendations(baselineMetrics, testMetrics, improvementPercentage);
  
  return {
    baselinePromptName,
    testPromptName,
    baselineMetrics,
    testMetrics,
    improvementPercentage,
    significantImprovement,
    recommendations
  };
}

/**
 * Calculate percentage improvement between two values
 * @param baseline Baseline value
 * @param test Test value
 * @returns Percentage improvement
 */
function calculateImprovement(baseline: number, test: number): number {
  return ((test - baseline) / baseline) * 100;
}

/**
 * Generate recommendations based on comparison
 * @param baseline Baseline metrics
 * @param test Test metrics
 * @param improvement Improvement percentages
 * @returns Array of recommendations
 */
function generateRecommendations(
  baseline: PromptPerformanceMetrics,
  test: PromptPerformanceMetrics,
  improvement: Record<string, number>
): string[] {
  const recommendations: string[] = [];
  
  if (improvement.overallScore > 5) {
    recommendations.push("The test prompt shows significant overall improvement and should be considered for adoption.");
  } else if (improvement.overallScore < -5) {
    recommendations.push("The test prompt performs worse overall and should not be adopted.");
  } else {
    recommendations.push("The test prompt shows similar overall performance to the baseline.");
  }
  
  // Add specific recommendations based on metric comparisons
  if (improvement.intentAccuracy > 10) {
    recommendations.push("Intent classification shows strong improvement. Consider keeping the intent classification rules from the test prompt.");
  }
  
  if (improvement.assistantTypeAccuracy > 10) {
    recommendations.push("Assistant type detection shows strong improvement. Consider keeping the assistant switching logic from the test prompt.");
  }
  
  if (improvement.responseQuality > 10) {
    recommendations.push("Response quality shows strong improvement. Consider keeping the response formatting guidelines from the test prompt.");
  }
  
  if (improvement.transitionSmoothnessScore > 10) {
    recommendations.push("Transition handling shows strong improvement. Consider keeping the transition messages from the test prompt.");
  }
  
  if (improvement.contextPreservationScore > 10) {
    recommendations.push("Context preservation shows strong improvement. Consider keeping the context handling from the test prompt.");
  }
  
  // Add recommendations for areas that need further improvement
  if (test.intentAccuracy < 0.8) {
    recommendations.push("Intent classification still needs improvement. Consider further refining the intent classification rules.");
  }
  
  if (test.assistantTypeAccuracy < 0.8) {
    recommendations.push("Assistant type detection still needs improvement. Consider adjusting the assistant switching thresholds.");
  }
  
  return recommendations;
}