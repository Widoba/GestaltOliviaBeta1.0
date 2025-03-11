#!/usr/bin/env node
/**
 * Simple Test Lister - JavaScript version
 * 
 * This is a simplified version of the test listing functionality to avoid TypeScript issues.
 */

// Import the test scenarios
const scenarios = require('../utils/userFlowTesting/scenarios');
const { employeeFlows, talentFlows, transitionFlows, endToEndFlows } = scenarios;

// Simple function to list all available test flows
function listFlows() {
  console.log('\nAvailable Test Flows:');
  console.log('====================\n');
  
  console.log('Employee Flows:');
  employeeFlows.forEach(flow => {
    console.log(`  - ${flow.id}: ${flow.name} (${flow.steps.length} steps) [${flow.tags.join(', ')}]`);
  });
  
  console.log('\nTalent Flows:');
  talentFlows.forEach(flow => {
    console.log(`  - ${flow.id}: ${flow.name} (${flow.steps.length} steps) [${flow.tags.join(', ')}]`);
  });
  
  console.log('\nTransition Flows:');
  transitionFlows.forEach(flow => {
    console.log(`  - ${flow.id}: ${flow.name} (${flow.steps.length} steps) [${flow.tags.join(', ')}]`);
  });
  
  console.log('\nEnd-to-End Flows:');
  endToEndFlows.forEach(flow => {
    console.log(`  - ${flow.id}: ${flow.name} (${flow.steps.length} steps) [${flow.tags.join(', ')}]`);
  });
  
  console.log('\nAvailable Tags:');
  const tags = new Set();
  const allFlowsArray = [
    ...employeeFlows,
    ...talentFlows,
    ...transitionFlows,
    ...endToEndFlows
  ];
  allFlowsArray.forEach(flow => {
    flow.tags.forEach(tag => tags.add(tag));
  });
  console.log(`  ${Array.from(tags).join(', ')}`);
  
  console.log('\nAvailable Categories:');
  console.log('  employee, talent, transition, error, ambiguous, end-to-end, performance');
}

// Run the list function
listFlows();