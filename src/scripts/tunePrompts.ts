/**
 * Prompt Tuning CLI Script
 * 
 * Command-line tool for prompt tuning with various options
 */
import * as fs from 'fs';
import * as path from 'path';
import promptTuningService from '../services/promptTuning/promptTuningService';
import promptVariationManager from '../services/promptTuning/promptVariationManager';
import { allTestCases } from '../utils/promptTesting/testCases';

// Format results into a nice table
function formatResultsTable(results: Array<{ name: string; score: number; improvement?: number }>) {
  // Define column widths
  const nameWidth = Math.max(...results.map(r => r.name.length), 30);
  const scoreWidth = 10;
  const improvementWidth = 12;
  
  // Create header
  const header = 
    'Variation'.padEnd(nameWidth) + ' | ' +
    'Score'.padEnd(scoreWidth) + ' | ' +
    'Improvement'.padEnd(improvementWidth);
  
  // Create separator
  const separator = '-'.repeat(nameWidth) + '-+-' + 
    '-'.repeat(scoreWidth) + '-+-' + 
    '-'.repeat(improvementWidth);
  
  // Create rows
  const rows = results.map(r => 
    r.name.padEnd(nameWidth) + ' | ' +
    r.score.toFixed(4).padEnd(scoreWidth) + ' | ' +
    (r.improvement !== undefined ? (r.improvement > 0 ? '+' : '') + r.improvement.toFixed(2) + '%' : 'N/A').padEnd(improvementWidth)
  );
  
  // Combine everything
  return [header, separator, ...rows].join('\n');
}

// Save the results to a file
function saveResultsToFile(filePath: string, content: string) {
  // Create the directory if it doesn't exist
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  // Write the file
  fs.writeFileSync(filePath, content);
  console.log(`Results saved to ${filePath}`);
}

// Main function
async function main() {
  try {
    // Parse command line arguments
    const args = process.argv.slice(2);
    
    // Default settings
    let command = 'all';
    let saveResults = false;
    let outputDir = './prompt-tuning-results';
    let variationId: string | undefined;
    let categoryFilter: string | undefined;
    
    // Parse arguments
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      if (arg === '--save') {
        saveResults = true;
      } else if (arg === '--output-dir' && i + 1 < args.length) {
        outputDir = args[++i];
      } else if (arg === '--variation' && i + 1 < args.length) {
        variationId = args[++i];
      } else if (arg === '--category' && i + 1 < args.length) {
        categoryFilter = args[++i];
      } else if (arg === '--help' || arg === '-h') {
        console.log(`
Prompt Tuning CLI

Usage: node tunePrompts.js [command] [options]

Commands:
  all             Run tests for all prompt variations (default)
  list            List all available prompt variations
  test            Test a specific prompt variation
  compare         Compare all variations to baseline
  optimize        Create an optimized prompt combining the best aspects
  
Options:
  --variation     Specify a variation ID for testing (used with 'test' command)
  --category      Specify a test category (basic, edge, ambiguous, context-dependent)
  --save          Save results to files
  --output-dir    Specify output directory for saved results (default: ./prompt-tuning-results)
  --help, -h      Show this help message
        `);
        return;
      } else {
        // Assume it's a command
        command = arg;
      }
    }
    
    // Execute the command
    if (command === 'list') {
      // List all variations
      const variations = promptVariationManager.getAllVariations();
      console.log('Available prompt variations:');
      console.log('--------------------------');
      for (const variation of variations) {
        console.log(`ID: ${variation.id}`);
        console.log(`Name: ${variation.name}`);
        console.log(`Description: ${variation.description}`);
        console.log(`Changes: ${variation.changes.length > 0 ? variation.changes.join(', ') : 'None'}`);
        console.log('--------------------------');
      }
    } else if (command === 'test') {
      // Test a specific variation
      if (!variationId) {
        console.error('Error: Must specify a variation ID with --variation');
        return;
      }
      
      console.log(`Testing variation: ${variationId}`);
      
      // Run tests based on category if specified
      if (categoryFilter && ['basic', 'edge', 'ambiguous', 'context-dependent'].includes(categoryFilter)) {
        console.log(`Filter: ${categoryFilter} test cases only`);
        const results = await promptTuningService.runCategoryTests(
          variationId,
          categoryFilter as any
        );
        
        const variation = promptVariationManager.getVariation(variationId);
        console.log(`Results for ${variation?.name || variationId} (${categoryFilter} tests):`);
        console.log(`Intent Accuracy: ${results.metrics.intentAccuracy.toFixed(4)}`);
        console.log(`Assistant Type Accuracy: ${results.metrics.assistantTypeAccuracy.toFixed(4)}`);
        console.log(`Response Quality: ${results.metrics.responseQuality.toFixed(4)}`);
        console.log(`Overall Score: ${results.metrics.overallScore.toFixed(4)}`);
        
        if (saveResults) {
          const content = JSON.stringify(results, null, 2);
          const fileName = `${variationId}_${categoryFilter}_tests_${new Date().toISOString().replace(/:/g, '-')}.json`;
          saveResultsToFile(path.join(outputDir, fileName), content);
        }
      } else {
        // Run all tests for this variation
        const results = await promptTuningService.runTests(variationId);
        
        const variation = promptVariationManager.getVariation(variationId);
        console.log(`Results for ${variation?.name || variationId}:`);
        console.log(`Intent Accuracy: ${results.metrics.intentAccuracy.toFixed(4)}`);
        console.log(`Assistant Type Accuracy: ${results.metrics.assistantTypeAccuracy.toFixed(4)}`);
        console.log(`Response Quality: ${results.metrics.responseQuality.toFixed(4)}`);
        console.log(`Overall Score: ${results.metrics.overallScore.toFixed(4)}`);
        
        if (saveResults) {
          const content = JSON.stringify(results, null, 2);
          const fileName = `${variationId}_tests_${new Date().toISOString().replace(/:/g, '-')}.json`;
          saveResultsToFile(path.join(outputDir, fileName), content);
        }
      }
    } else if (command === 'compare') {
      // Compare all variations to baseline
      console.log('Comparing all variations to baseline...');
      await promptTuningService.compareAllVariations();
      
      // Get the results
      const variations = promptVariationManager.getAllVariations();
      const baselineResults = promptTuningService.getTestResults('baseline');
      
      if (!baselineResults) {
        console.error('Error: No baseline results found');
        return;
      }
      
      const baselineScore = baselineResults.metrics.overallScore;
      
      // Format results table
      const tableData = variations.map(variation => {
        const results = promptTuningService.getTestResults(variation.id);
        if (!results) {
          return {
            name: variation.name,
            score: 0,
          };
        }
        
        const score = results.metrics.overallScore;
        const improvement = variation.id === 'baseline' ? undefined : ((score - baselineScore) / baselineScore) * 100;
        
        return {
          name: variation.name,
          score,
          improvement
        };
      });
      
      // Sort by score (descending)
      tableData.sort((a, b) => b.score - a.score);
      
      // Print the table
      console.log('\nVariation Comparison Results:');
      console.log(formatResultsTable(tableData));
      
      if (saveResults) {
        const content = JSON.stringify({
          baseline: baselineResults,
          comparisons: Array.from(promptTuningService['comparisons'].values())
        }, null, 2);
        const fileName = `comparison_results_${new Date().toISOString().replace(/:/g, '-')}.json`;
        saveResultsToFile(path.join(outputDir, fileName), content);
        
        // Also save the table
        const tableContent = formatResultsTable(tableData);
        const tableFileName = `comparison_table_${new Date().toISOString().replace(/:/g, '-')}.txt`;
        saveResultsToFile(path.join(outputDir, tableFileName), tableContent);
      }
    } else if (command === 'optimize') {
      // Create an optimized prompt
      console.log('Creating optimized prompt...');
      const optimizedVariation = await promptTuningService.createOptimizedPrompt();
      console.log(`Optimized prompt created with ID: ${optimizedVariation.id}`);
      
      // Test the optimized prompt
      console.log('Testing optimized prompt...');
      const results = await promptTuningService.runTests(optimizedVariation.id);
      
      // Compare with baseline
      console.log('Comparing with baseline...');
      const comparison = await promptTuningService.compareWithBaseline(optimizedVariation.id);
      
      // Print results
      console.log(`\nOptimized Prompt Results:`);
      console.log(`Intent Accuracy: ${results.metrics.intentAccuracy.toFixed(4)}`);
      console.log(`Assistant Type Accuracy: ${results.metrics.assistantTypeAccuracy.toFixed(4)}`);
      console.log(`Response Quality: ${results.metrics.responseQuality.toFixed(4)}`);
      console.log(`Overall Score: ${results.metrics.overallScore.toFixed(4)}`);
      
      const baselineResults = promptTuningService.getTestResults('baseline');
      if (baselineResults) {
        const baselineScore = baselineResults.metrics.overallScore;
        const improvement = ((results.metrics.overallScore - baselineScore) / baselineScore) * 100;
        console.log(`Improvement over baseline: ${improvement > 0 ? '+' : ''}${improvement.toFixed(2)}%`);
      }
      
      // Print recommendations
      console.log('\nRecommendations:');
      for (const recommendation of comparison.comparison.recommendations) {
        console.log(`- ${recommendation}`);
      }
      
      if (saveResults) {
        // Save the optimized prompt
        const promptContent = optimizedVariation.basePrompt;
        const promptFileName = `optimized_prompt_${new Date().toISOString().replace(/:/g, '-')}.txt`;
        saveResultsToFile(path.join(outputDir, promptFileName), promptContent);
        
        // Save the results
        const resultsContent = JSON.stringify({
          variation: optimizedVariation,
          testResults: results,
          comparison: comparison
        }, null, 2);
        const resultsFileName = `optimized_results_${new Date().toISOString().replace(/:/g, '-')}.json`;
        saveResultsToFile(path.join(outputDir, resultsFileName), resultsContent);
      }
    } else if (command === 'all') {
      // Run tests for all variations and compare
      console.log('Running tests for all prompt variations...');
      
      // Log test case counts
      console.log(`Test cases: ${allTestCases.length} total`);
      
      // Run tests for all variations
      await promptTuningService.runAllTests();
      console.log('Tests completed. Comparing variations...');
      
      // Compare all variations
      await promptTuningService.compareAllVariations();
      
      // Get the results
      const variations = promptVariationManager.getAllVariations();
      const baselineResults = promptTuningService.getTestResults('baseline');
      
      if (!baselineResults) {
        console.error('Error: No baseline results found');
        return;
      }
      
      const baselineScore = baselineResults.metrics.overallScore;
      
      // Format results table
      const tableData = variations.map(variation => {
        const results = promptTuningService.getTestResults(variation.id);
        if (!results) {
          return {
            name: variation.name,
            score: 0,
          };
        }
        
        const score = results.metrics.overallScore;
        const improvement = variation.id === 'baseline' ? undefined : ((score - baselineScore) / baselineScore) * 100;
        
        return {
          name: variation.name,
          score,
          improvement
        };
      });
      
      // Sort by score (descending)
      tableData.sort((a, b) => b.score - a.score);
      
      // Print the table
      console.log('\nVariation Comparison Results:');
      console.log(formatResultsTable(tableData));
      
      // Create and test optimized prompt
      console.log('\nCreating optimized prompt...');
      const optimizedVariation = await promptTuningService.createOptimizedPrompt();
      console.log(`Optimized prompt created with ID: ${optimizedVariation.id}`);
      
      // Test the optimized prompt
      console.log('Testing optimized prompt...');
      const optimizedResults = await promptTuningService.runTests(optimizedVariation.id);
      
      // Add to table
      const optimizedScore = optimizedResults.metrics.overallScore;
      const optimizedImprovement = ((optimizedScore - baselineScore) / baselineScore) * 100;
      
      // Print optimized results
      console.log('\nOptimized Prompt Results:');
      console.log(formatResultsTable([
        {
          name: 'Baseline',
          score: baselineScore
        },
        {
          name: optimizedVariation.name,
          score: optimizedScore,
          improvement: optimizedImprovement
        }
      ]));
      
      if (saveResults) {
        // Save the comparison results
        const comparisonContent = JSON.stringify({
          baseline: baselineResults,
          variations: Array.from(promptTuningService['testResults'].values()),
          comparisons: Array.from(promptTuningService['comparisons'].values())
        }, null, 2);
        const comparisonFileName = `all_results_${new Date().toISOString().replace(/:/g, '-')}.json`;
        saveResultsToFile(path.join(outputDir, comparisonFileName), comparisonContent);
        
        // Save the table
        const tableContent = formatResultsTable(tableData);
        const tableFileName = `results_table_${new Date().toISOString().replace(/:/g, '-')}.txt`;
        saveResultsToFile(path.join(outputDir, tableFileName), tableContent);
        
        // Save the optimized prompt
        const promptContent = optimizedVariation.basePrompt;
        const promptFileName = `optimized_prompt_${new Date().toISOString().replace(/:/g, '-')}.txt`;
        saveResultsToFile(path.join(outputDir, promptFileName), promptContent);
      }
    } else {
      console.error(`Unknown command: ${command}`);
      console.log('Use --help for usage information');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the main function
main().catch(console.error);