/**
 * Service for loading and initializing data for use in the application
 */
import dataService from './dataService';
import * as dataFormatters from '../utils/dataFormatters';

/**
 * Interface for data to be included in prompts
 */
export interface PromptData {
  employees?: any[];
  shifts?: any[];
  employeeTasks?: any[];
  talentTasks?: any[];
  recognitionTasks?: any[];
  shiftTasks?: any[];
  jobs?: any[];
  candidates?: any[];
  recognition?: any[];
  [key: string]: any;
}

/**
 * DataLoaderService for managing data loading and preparation
 */
class DataLoaderService {
  private cachedData: PromptData | null = null;
  private lastLoaded: number = 0;
  private cacheExpiryMs: number = 5 * 60 * 1000; // 5 minutes
  
  /**
   * Loads all data for use in the application
   * @param forceRefresh Force a data refresh even if cache is valid
   * @returns Promise resolving to the loaded data
   */
  async loadAllData(forceRefresh: boolean = false): Promise<PromptData> {
    const now = Date.now();
    
    // Return cached data if available and not expired
    if (
      !forceRefresh && 
      this.cachedData && 
      now - this.lastLoaded < this.cacheExpiryMs
    ) {
      return this.cachedData;
    }
    
    try {
      // Load all data types in parallel
      const [
        employees,
        shifts,
        employeeTasks,
        talentTasks,
        recognitionTasks,
        shiftTasks,
        jobs,
        candidates,
        recognition
      ] = await Promise.all([
        dataService.getEmployees(),
        dataService.getShifts(),
        dataService.getEmployeeTasks(),
        dataService.getTalentTasks(),
        dataService.getRecognitionTasks(),
        dataService.getShiftTasks(),
        dataService.getJobs(),
        dataService.getCandidates(),
        dataService.getRecognitions()
      ]);
      
      // Update cache
      this.cachedData = {
        employees,
        shifts,
        employeeTasks,
        talentTasks,
        recognitionTasks,
        shiftTasks,
        jobs,
        candidates,
        recognition
      };
      
      this.lastLoaded = now;
      return this.cachedData;
    } catch (error) {
      console.error('Error loading data:', error);
      throw new Error('Failed to load application data');
    }
  }
  
  /**
   * Loads data for a specific manager
   * @param managerId Manager ID
   * @returns Promise resolving to the manager-specific data
   */
  async loadManagerData(managerId: string): Promise<PromptData> {
    try {
      const data = await dataService.getManagerDashboardData(managerId);
      return data;
    } catch (error) {
      console.error(`Error loading manager data for ${managerId}:`, error);
      throw new Error(`Failed to load data for manager ${managerId}`);
    }
  }
  
  /**
   * Loads data relevant to a user query
   * @param query User query string
   * @returns Promise resolving to data relevant to the query
   */
  async loadDataForQuery(query: string): Promise<PromptData> {
    try {
      // Load all data first
      const allData = await this.loadAllData();
      
      // Extract relevant data based on the query
      const relevantData = dataFormatters.extractRelevantData(allData, query);
      
      return relevantData;
    } catch (error) {
      console.error('Error loading data for query:', error);
      throw new Error('Failed to load data for your query');
    }
  }
  
  /**
   * Formats data for inclusion in prompts
   * @param data Raw data objects
   * @returns Formatted string representation for prompts
   */
  formatDataForPrompt(data: PromptData): string {
    let promptData = '';
    
    // Format each data type if present
    if (data.employees && data.employees.length > 0) {
      promptData += '\n## Employees\n';
      promptData += data.employees.length > 5 
        ? dataFormatters.formatEmployeeList(data.employees) 
        : data.employees.map(dataFormatters.formatEmployee).join('\n');
    }
    
    if (data.shifts && data.shifts.length > 0) {
      promptData += '\n## Shifts\n';
      promptData += data.shifts.length > 3 
        ? dataFormatters.formatShiftList(data.shifts) 
        : data.shifts.map(dataFormatters.formatShift).join('\n');
    }
    
    if (data.employeeTasks && data.employeeTasks.length > 0) {
      promptData += '\n## Employee Tasks\n';
      promptData += data.employeeTasks.length > 3 
        ? `${data.employeeTasks.length} tasks (${data.employeeTasks.filter(t => t.status === 'pending').length} pending)` 
        : data.employeeTasks.map(dataFormatters.formatEmployeeTask).join('\n');
    }
    
    if (data.talentTasks && data.talentTasks.length > 0) {
      promptData += '\n## Talent Tasks\n';
      promptData += data.talentTasks.length > 3 
        ? `${data.talentTasks.length} tasks (${data.talentTasks.filter(t => t.status === 'pending').length} pending)` 
        : data.talentTasks.map(dataFormatters.formatTalentTask).join('\n');
    }
    
    if (data.jobs && data.jobs.length > 0) {
      promptData += '\n## Jobs\n';
      promptData += data.jobs.length > 3 
        ? dataFormatters.formatJobList(data.jobs) 
        : data.jobs.map(dataFormatters.formatJob).join('\n');
    }
    
    if (data.candidates && data.candidates.length > 0) {
      promptData += '\n## Candidates\n';
      if (data.candidates.length > 3) {
        promptData += dataFormatters.formatCandidatePipelineSummary(data.candidates);
      } else {
        data.candidates.forEach(candidate => {
          promptData += dataFormatters.formatCandidate(candidate);
        });
      }
    }
    
    if (data.recognition && data.recognition.length > 0) {
      promptData += '\n## Recognition\n';
      promptData += data.recognition.length > 3 
        ? `${data.recognition.length} recognition entries` 
        : data.recognition.map(dataFormatters.formatRecognition).join('\n');
    }
    
    return promptData;
  }
  
  /**
   * Classifies the domain of a user query
   * @param query User query
   * @param relevantData Data relevant to the query
   * @returns Classification scores for each domain
   */
  classifyQueryDomain(query: string, relevantData: PromptData): { 
    employeeAssistance: number, 
    talentAcquisition: number 
  } {
    // First, analyze the query text itself
    const queryClassification = this.classifyQueryText(query);
    
    // Then, analyze the relevant data
    const dataClassification = dataFormatters.classifyDataDomain(relevantData);
    
    // Combine both scores (weighted: 70% query, 30% data)
    return {
      employeeAssistance: (queryClassification.employeeAssistance * 0.7) + 
                         (dataClassification.employeeAssistance * 0.3),
      talentAcquisition: (queryClassification.talentAcquisition * 0.7) + 
                        (dataClassification.talentAcquisition * 0.3)
    };
  }
  
  /**
   * Analyzes query text to determine its domain
   * @param query User query
   * @returns Classification scores based on query text
   */
  private classifyQueryText(query: string): { 
    employeeAssistance: number, 
    talentAcquisition: number 
  } {
    const queryLower = query.toLowerCase();
    
    // Employee assistance keywords
    const employeeKeywords = [
      'employee', 'shift', 'schedule', 'time off', 'pto', 'performance', 
      'review', 'training', 'development', 'recognition', 'feedback',
      'hr', 'human resources', 'policy', 'benefits', 'compensation'
    ];
    
    // Talent acquisition keywords
    const talentKeywords = [
      'candidate', 'job', 'requisition', 'interview', 'offer',
      'recruitment', 'hiring', 'resume', 'screening', 'onboarding',
      'application', 'skills', 'talent', 'position', 'vacancy'
    ];
    
    let employeeScore = 0;
    let talentScore = 0;
    
    // Count keyword matches for each domain
    employeeKeywords.forEach(keyword => {
      if (queryLower.includes(keyword)) {
        employeeScore += 1;
      }
    });
    
    talentKeywords.forEach(keyword => {
      if (queryLower.includes(keyword)) {
        talentScore += 1;
      }
    });
    
    // Normalize scores
    const total = employeeScore + talentScore;
    if (total > 0) {
      employeeScore = employeeScore / total;
      talentScore = talentScore / total;
    } else {
      // If no keywords matched, default to equal probability
      employeeScore = 0.5;
      talentScore = 0.5;
    }
    
    return {
      employeeAssistance: employeeScore,
      talentAcquisition: talentScore
    };
  }
}

// Export a singleton instance
const dataLoaderService = new DataLoaderService();
export default dataLoaderService;