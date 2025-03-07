/**
 * Prompt Tuning Example
 * 
 * This script demonstrates the key functionality of the prompt tuning framework
 */
import promptVariationManager from '../services/promptTuning/promptVariationManager';
import promptTuningService from '../services/promptTuning/promptTuningService';
import { employeeBasicTestCases } from '../utils/promptTesting/testCases';

async function runPromptTuningExample() {
  console.log('Prompt Tuning Framework Example\n');
  
  // 1. List available variations
  console.log('Available Prompt Variations:');
  const variations = promptVariationManager.getAllVariations();
  variations.forEach(variation => {
    console.log(`- ${variation.name} (ID: ${variation.id})`);
  });
  console.log();
  
  // 2. Run tests on baseline prompt
  console.log('Testing baseline prompt with employee test cases...');
  const baselineResults = await promptTuningService.runCategoryTests('baseline', 'basic');
  
  console.log('Baseline Results:');
  console.log(`- Intent Accuracy: ${baselineResults.metrics.intentAccuracy.toFixed(4)}`);
  console.log(`- Assistant Type Accuracy: ${baselineResults.metrics.assistantTypeAccuracy.toFixed(4)}`);
  console.log(`- Overall Score: ${baselineResults.metrics.overallScore.toFixed(4)}`);
  console.log();
  
  // 3. Create a custom prompt variation
  console.log('Creating custom prompt variation...');
  
  // Get the baseline prompt
  const baselinePrompt = promptVariationManager.getBaseline().basePrompt;
  
  // Make a simple modification
  const customPrompt = baselinePrompt.replace(
    '### Classification Heuristics:',
    `### Classification Heuristics:
    
- CUSTOM RULE: When a query mentions "schedule" or "shift", always prioritize the Employee Assistant with high confidence.
- CUSTOM RULE: When a query mentions "task" or "todo", assign to Employee Assistant with high confidence.
- CUSTOM RULE: For queries about specific employees by name, default to Employee Assistant unless explicitly about hiring or interviews.`
  );
  
  // Create the variation
  const customVariation = promptVariationManager.createVariation(
    'Custom Employee-Focused Prompt',
    'Enhanced prompt with emphasis on employee scheduling and tasks',
    customPrompt,
    promptVariationManager.getBaseline().employeePrompt,
    promptVariationManager.getBaseline().talentPrompt,
    ['Added custom classification rules for employee schedules and tasks']
  );
  
  console.log(`Created custom variation with ID: ${customVariation.id}`);
  console.log();
  
  // 4. Test the custom variation
  console.log('Testing custom variation...');
  const customResults = await promptTuningService.runCategoryTests(customVariation.id, 'basic');
  
  console.log('Custom Variation Results:');
  console.log(`- Intent Accuracy: ${customResults.metrics.intentAccuracy.toFixed(4)}`);
  console.log(`- Assistant Type Accuracy: ${customResults.metrics.assistantTypeAccuracy.toFixed(4)}`);
  console.log(`- Overall Score: ${customResults.metrics.overallScore.toFixed(4)}`);
  console.log();
  
  // 5. Compare with baseline
  console.log('Comparing with baseline...');
  const comparison = await promptTuningService.compareWithBaseline(customVariation.id);
  
  const baselineScore = baselineResults.metrics.overallScore;
  const customScore = customResults.metrics.overallScore;
  const improvement = ((customScore - baselineScore) / baselineScore) * 100;
  
  console.log(`Improvement over baseline: ${improvement > 0 ? '+' : ''}${improvement.toFixed(2)}%`);
  console.log('\nRecommendations:');
  comparison.comparison.recommendations.forEach(rec => {
    console.log(`- ${rec}`);
  });
  console.log();
  
  // 6. Create optimized prompt
  console.log('Creating optimized prompt from all variations...');
  const optimizedVariation = await promptTuningService.createOptimizedPrompt();
  
  console.log(`Optimized prompt created with ID: ${optimizedVariation.id}`);
  console.log('\nChanges incorporated:');
  optimizedVariation.changes.forEach(change => {
    console.log(`- ${change}`);
  });
  console.log();
  
  // 7. Test optimized prompt
  console.log('Testing optimized prompt...');
  const optimizedResults = await promptTuningService.runTests(optimizedVariation.id);
  
  console.log('Optimized Prompt Results:');
  console.log(`- Intent Accuracy: ${optimizedResults.metrics.intentAccuracy.toFixed(4)}`);
  console.log(`- Assistant Type Accuracy: ${optimizedResults.metrics.assistantTypeAccuracy.toFixed(4)}`);
  console.log(`- Overall Score: ${optimizedResults.metrics.overallScore.toFixed(4)}`);
  
  // Calculate improvement over baseline
  const optimizedImprovement = ((optimizedResults.metrics.overallScore - baselineScore) / baselineScore) * 100;
  console.log(`Improvement over baseline: ${optimizedImprovement > 0 ? '+' : ''}${optimizedImprovement.toFixed(2)}%`);
  
  console.log('\nPrompt tuning example completed successfully!');
}

// Run the example
runPromptTuningExample().catch(console.error);