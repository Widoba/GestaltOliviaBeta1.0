/**
 * Utility functions for prompt management and formatting
 */
import { 
  baseSystemPrompt, 
  employeeAssistantPrompt, 
  talentAssistantPrompt 
} from '../prompts';
import { PromptData } from '../services/dataLoaderService';

// Export the base prompts
export const BASE_SYSTEM_PROMPT = baseSystemPrompt;
export const EMPLOYEE_SYSTEM_PROMPT = employeeAssistantPrompt;
export const TALENT_ACQUISITION_SYSTEM_PROMPT = talentAssistantPrompt;

/**
 * Interface for dynamic prompt data
 */
export interface DynamicPromptData {
  userName?: string;
  department?: string;
  role?: string;
  company?: string;
  [key: string]: any;
}

/**
 * Formats a system prompt with dynamic data
 * @param prompt The base prompt to format
 * @param data The data to insert into the prompt
 * @returns The formatted prompt
 */
export function formatPrompt(prompt: string, data: DynamicPromptData = {}): string {
  let formattedPrompt = prompt;
  
  // Replace placeholders with values from data
  Object.entries(data).forEach(([key, value]) => {
    formattedPrompt = formattedPrompt.replace(
      new RegExp(`{${key}}`, 'g'), 
      String(value || '')
    );
  });
  
  return formattedPrompt;
}

/**
 * Combines the base system prompt with relevant data for a query
 * @param prompt Base system prompt
 * @param relevantData Relevant data for the query
 * @returns Enhanced system prompt with data
 */
export function enhancePromptWithData(prompt: string, relevantData: string): string {
  if (!relevantData || relevantData.trim() === '') {
    return prompt;
  }
  
  return `${prompt}\n\n## RELEVANT DATA CONTEXT\n\nThe following data is relevant to the user's query:\n\n${relevantData}`;
}

/**
 * Selects the appropriate system prompt based on assistant type
 * @param assistantType Type of assistant (unified, employee, talent)
 * @returns The appropriate system prompt
 */
export function selectPromptByAssistantType(assistantType: 'unified' | 'employee' | 'talent'): string {
  switch (assistantType) {
    case 'employee':
      return EMPLOYEE_SYSTEM_PROMPT;
    case 'talent':
      return TALENT_ACQUISITION_SYSTEM_PROMPT;
    default:
      return BASE_SYSTEM_PROMPT;
  }
}

/**
 * Constructs a custom system prompt for a specific query and context
 * @param assistantType Type of assistant
 * @param queryContext Additional context for the query
 * @param relevantData Relevant data for the query
 * @returns Customized system prompt
 */
export function constructCustomPrompt(
  assistantType: 'unified' | 'employee' | 'talent',
  queryContext: DynamicPromptData = {},
  relevantData: string = ''
): string {
  // Get the base prompt for this assistant type
  const basePrompt = selectPromptByAssistantType(assistantType);
  
  // Format the prompt with query context
  const formattedPrompt = formatPrompt(basePrompt, queryContext);
  
  // Enhance the prompt with relevant data
  return enhancePromptWithData(formattedPrompt, relevantData);
}

export default {
  BASE_SYSTEM_PROMPT,
  EMPLOYEE_SYSTEM_PROMPT,
  TALENT_ACQUISITION_SYSTEM_PROMPT,
  formatPrompt,
  enhancePromptWithData,
  selectPromptByAssistantType,
  constructCustomPrompt
};