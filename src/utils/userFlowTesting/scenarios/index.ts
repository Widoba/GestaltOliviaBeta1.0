/**
 * User Flow Testing Scenarios
 * 
 * Exports all available test scenarios by category
 */

import { employeeFlows } from './employeeFlows';
import { talentFlows } from './talentFlows';
import { transitionFlows } from './transitionFlows';
import { endToEndFlows } from './endToEndFlows';
import { TestFlow } from '../types';

// Combine all flows into a single array
const allFlows: TestFlow[] = [
  ...employeeFlows,
  ...talentFlows,
  ...transitionFlows,
  ...endToEndFlows
];

// Export individual flow categories
export {
  employeeFlows,
  talentFlows,
  transitionFlows,
  endToEndFlows
};

// Export combined flows
export default allFlows;