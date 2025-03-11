/**
 * User Flow Testing Scenarios
 * 
 * Exports all available test scenarios by category
 */

// Using require for CommonJS compatibility
const { employeeFlows } = require('./employeeFlows');
const { talentFlows } = require('./talentFlows');
const { transitionFlows } = require('./transitionFlows');
const { endToEndFlows } = require('./endToEndFlows');
const { TestFlow } = require('../types.js');

// Combine all flows into a single array
const allFlows = [
  ...employeeFlows,
  ...talentFlows,
  ...transitionFlows,
  ...endToEndFlows
];

// Export for CommonJS
module.exports = {
  employeeFlows,
  talentFlows,
  transitionFlows,
  endToEndFlows,
  default: allFlows
};