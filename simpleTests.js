#!/usr/bin/env node
/**
 * Simple Test Validator
 * 
 * This script validates the test flow definitions without running actual tests.
 */

// Import test scenario files directly
const employeeFiles = require('./src/utils/userFlowTesting/scenarios/employeeFlows');
const talentFiles = require('./src/utils/userFlowTesting/scenarios/talentFlows');
const transitionFiles = require('./src/utils/userFlowTesting/scenarios/transitionFlows');
const endToEndFiles = require('./src/utils/userFlowTesting/scenarios/endToEndFlows');

// Get flow arrays from imported files
const employeeFlows = employeeFiles.employeeFlows || [];
const talentFlows = talentFiles.talentFlows || [];
const transitionFlows = transitionFiles.transitionFlows || [];
const endToEndFlows = endToEndFiles.endToEndFlows || [];

// Basic validation function
function validateTestFlows(flows, category) {
  console.log(`\nValidating ${category} Flows:`);
  console.log('----------------------');
  
  if (!Array.isArray(flows)) {
    console.error(`ERROR: ${category} flows is not an array`);
    return 0;
  }
  
  if (flows.length === 0) {
    console.error(`ERROR: No ${category} flows found`);
    return 0;
  }
  
  let validFlows = 0;
  let totalSteps = 0;
  
  flows.forEach(flow => {
    let issues = [];
    let valid = true;
    
    // Check basic properties
    if (!flow.id) { issues.push("Missing id"); valid = false; }
    if (!flow.name) { issues.push("Missing name"); valid = false; }
    if (!flow.description) { issues.push("Missing description"); valid = false; }
    if (!flow.category) { issues.push("Missing category"); valid = false; }
    
    // Check steps array
    if (!Array.isArray(flow.steps)) {
      issues.push("Steps is not an array");
      valid = false;
    } else {
      if (flow.steps.length === 0) {
        issues.push("No steps defined");
        valid = false;
      } else {
        totalSteps += flow.steps.length;
        
        // Check individual steps
        flow.steps.forEach((step, index) => {
          if (!step.message) {
            issues.push(`Step ${index + 1}: Missing message`);
            valid = false;
          }
          if (!step.expectedAssistantType) {
            issues.push(`Step ${index + 1}: Missing expectedAssistantType`);
            valid = false;
          }
        });
      }
    }
    
    // Report result
    if (valid) {
      console.log(`✓ ${flow.id}: ${flow.name} (${flow.steps.length} steps)`);
      validFlows++;
    } else {
      console.error(`✗ ${flow.id}: ${flow.name}`);
      issues.forEach(issue => {
        console.error(`  - ${issue}`);
      });
    }
  });
  
  console.log(`\nSummary: ${validFlows}/${flows.length} valid flows, ${totalSteps} total steps`);
  return validFlows;
}

// Validate all flow categories
let totalValidFlows = 0;
totalValidFlows += validateTestFlows(employeeFlows, "Employee");
totalValidFlows += validateTestFlows(talentFlows, "Talent");
totalValidFlows += validateTestFlows(transitionFlows, "Transition");
totalValidFlows += validateTestFlows(endToEndFlows, "End-to-End");

// Overall summary
const totalFlows = 
  employeeFlows.length + 
  talentFlows.length + 
  transitionFlows.length + 
  endToEndFlows.length;

console.log("\n=======================================");
console.log(`OVERALL: ${totalValidFlows}/${totalFlows} valid flows`);
console.log("=======================================");

// Return success if all flows are valid
process.exit(totalValidFlows === totalFlows ? 0 : 1);