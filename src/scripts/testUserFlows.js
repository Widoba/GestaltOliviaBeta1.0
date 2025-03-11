#!/usr/bin/env node
/**
 * User Flow Testing CLI
 * 
 * Command line interface for executing user flow tests.
 * 
 * Usage:
 *   node testUserFlows.js [command] [options]
 * 
 * Commands:
 *   run [flowIds...]  Run specific flows by ID
 *   category [cats]   Run flows by category
 *   tag [tags...]     Run flows by tag
 *   all               Run all flows
 *   list              List available flows
 *   report            Show most recent test report
 * 
 * Options:
 *   --verbose         Show detailed output
 *   --save            Save test results
 *   --stop-on-failure Stop execution on first failure
 *   --no-color        Disable colored output
 */

const fs = require('fs');
const path = require('path');

// Using require for CommonJS compatibility
const userFlowTestingFramework = require('../utils/userFlowTesting/userFlowTestingFramework.js').default;
const scenarios = require('../utils/userFlowTesting/scenarios/index.js');
const allFlows = scenarios.default;
const { employeeFlows, talentFlows, transitionFlows, endToEndFlows } = scenarios;
const { TestFlowCategory } = require('../utils/userFlowTesting/types.js');

// Register all flows with the framework
userFlowTestingFramework.registerFlows(allFlows);

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0] || 'help';

// Parse options
const options = {
  verbose: args.includes('--verbose'),
  saveResults: args.includes('--save'),
  stopOnFailure: args.includes('--stop-on-failure')
};

// Set timeout (default 30 seconds)
if (args.includes('--timeout')) {
  const timeoutIndex = args.indexOf('--timeout');
  if (timeoutIndex + 1 < args.length) {
    options.timeout = parseInt(args[timeoutIndex + 1], 10);
  }
}

// Handle commands
async function main() {
  switch (command) {
    case 'run':
      // Get flow IDs to run
      const flowIds = args.slice(1).filter(arg => !arg.startsWith('--'));
      
      if (flowIds.length === 0) {
        console.error('Error: No flow IDs specified. Use "list" to see available flows.');
        process.exit(1);
      }
      
      options.flowIds = flowIds;
      await userFlowTestingFramework.executeFlows(options);
      break;
      
    case 'category':
      // Get categories to run
      const categories = args.slice(1).filter(arg => !arg.startsWith('--'));
      
      if (categories.length === 0) {
        console.error('Error: No categories specified. Available categories: employee, talent, transition, error, ambiguous, end-to-end, performance');
        process.exit(1);
      }
      
      options.categories = categories;
      await userFlowTestingFramework.executeFlows(options);
      break;
      
    case 'tag':
      // Get tags to run
      const tags = args.slice(1).filter(arg => !arg.startsWith('--'));
      
      if (tags.length === 0) {
        console.error('Error: No tags specified. Use "list" to see available tags.');
        process.exit(1);
      }
      
      options.tags = tags;
      await userFlowTestingFramework.executeFlows(options);
      break;
      
    case 'all':
      // Run all flows
      await userFlowTestingFramework.executeFlows(options);
      break;
      
    case 'list':
      // List available flows
      listFlows();
      break;
      
    case 'report':
      // Show most recent test report
      showReport();
      break;
      
    case 'help':
    default:
      showHelp();
      break;
  }
}

/**
 * Display help information
 */
function showHelp() {
  console.log(`
User Flow Testing CLI
=====================

Usage:
  node testUserFlows.js [command] [options]

Commands:
  run [flowIds...]   Run specific flows by ID
  category [cats]    Run flows by category
  tag [tags...]      Run flows by tag
  all                Run all flows
  list               List available flows
  report             Show most recent test report

Options:
  --verbose          Show detailed output
  --save             Save test results (default true)
  --stop-on-failure  Stop execution on first failure
  --timeout [ms]     Set timeout for each step (default 30000ms)
  
Examples:
  # Run all flows
  node testUserFlows.js all
  
  # Run specific flows
  node testUserFlows.js run employee-schedule-flow employee-task-flow
  
  # Run all flows in a category
  node testUserFlows.js category employee
  
  # Run flows with specific tags
  node testUserFlows.js tag happy-path transition
  
  # List all flows
  node testUserFlows.js list
  `);
}

/**
 * List all available flows
 */
function listFlows() {
  const allFlows = userFlowTestingFramework.getRegisteredFlows();
  
  console.log('\nAvailable Test Flows:');
  console.log('====================\n');
  
  console.log('Employee Flows:');
  employeeFlows.forEach((flow) => {
    console.log(`  - ${flow.id}: ${flow.name} (${flow.steps.length} steps) [${flow.tags.join(', ')}]`);
  });
  
  console.log('\nTalent Flows:');
  talentFlows.forEach((flow) => {
    console.log(`  - ${flow.id}: ${flow.name} (${flow.steps.length} steps) [${flow.tags.join(', ')}]`);
  });
  
  console.log('\nTransition Flows:');
  transitionFlows.forEach((flow) => {
    console.log(`  - ${flow.id}: ${flow.name} (${flow.steps.length} steps) [${flow.tags.join(', ')}]`);
  });
  
  console.log('\nEnd-to-End Flows:');
  endToEndFlows.forEach((flow) => {
    console.log(`  - ${flow.id}: ${flow.name} (${flow.steps.length} steps) [${flow.tags.join(', ')}]`);
  });
  
  console.log('\nAvailable Tags:');
  const tags = new Set();
  // Using different approach for getting tags since allFlows structure changed
  const allFlowsArray = [
    ...employeeFlows,
    ...talentFlows,
    ...transitionFlows,
    ...endToEndFlows
  ];
  allFlowsArray.forEach((flow) => {
    flow.tags.forEach((tag) => tags.add(tag));
  });
  console.log(`  ${Array.from(tags).join(', ')}`);
  
  console.log('\nAvailable Categories:');
  console.log('  employee, talent, transition, error, ambiguous, end-to-end, performance');
}

/**
 * Show the most recent test report
 */
function showReport() {
  const report = userFlowTestingFramework.getMostRecentReport();
  
  if (!report) {
    console.error('No test reports found. Run some tests first.');
    return;
  }
  
  console.log('\nMost Recent Test Report:');
  console.log('=======================\n');
  console.log(`Generated: ${report.timestamp}`);
  console.log(`Total Flows: ${report.summary.totalFlows}`);
  const summary = report.summary;
  const metrics = report.metrics;
  
  console.log(`Passed Flows: ${summary.passedFlows}/${summary.totalFlows} (${(summary.passedFlows / summary.totalFlows * 100).toFixed(1)}%)`);
  console.log(`Failed Flows: ${summary.failedFlows}/${summary.totalFlows} (${(summary.failedFlows / summary.totalFlows * 100).toFixed(1)}%)`);
  console.log(`Total Steps: ${summary.totalSteps}`);
  console.log(`Passed Steps: ${summary.passedSteps}/${summary.totalSteps} (${(summary.passedSteps / summary.totalSteps * 100).toFixed(1)}%)`);
  console.log(`Duration: ${summary.duration}ms`);
  
  console.log('\nMetrics:');
  console.log(`- Assistant Type Accuracy: ${(metrics.assistantTypeAccuracy * 100).toFixed(1)}%`);
  if (metrics.intentClassificationAccuracy !== undefined) {
    console.log(`- Intent Classification Accuracy: ${(metrics.intentClassificationAccuracy * 100).toFixed(1)}%`);
  }
  if (metrics.entityDetectionAccuracy !== undefined) {
    console.log(`- Entity Detection Accuracy: ${(metrics.entityDetectionAccuracy * 100).toFixed(1)}%`);
  }
  if (metrics.functionCallAccuracy !== undefined) {
    console.log(`- Function Call Accuracy: ${(metrics.functionCallAccuracy * 100).toFixed(1)}%`);
  }
  if (metrics.transitionSuccessRate !== undefined) {
    console.log(`- Transition Success Rate: ${(metrics.transitionSuccessRate * 100).toFixed(1)}%`);
  }
  
  console.log('\nCategory Results:');
  Object.entries(report.categories || {}).forEach(([category, results]) => {
    console.log(`- ${category}: ${results.flows} flows, ${(results.passRate * 100).toFixed(1)}% pass rate`);
  });
  
  console.log('\nFlow Results:');
  report.flowResults.forEach((result) => {
    console.log(`- ${result.flowId}: ${result.successful ? '✓ PASSED' : '✗ FAILED'} (${result.steps.filter((s) => s.passed).length}/${result.steps.length} steps passed)`);
  });
  
  console.log('\nFor detailed results, see the test-results directory.');
}

// Execute the main function
main().catch(error => {
  console.error('Error executing test flows:', error);
  process.exit(1);
});