/**
 * Service for injecting relevant data into prompts
 */
import { RetrievedData } from './dataRetrievalService';
import dataRetrievalService from './dataRetrievalService';
import queryAnalysisService, { QueryAnalysis } from './queryAnalysisService';
import * as dataFormatters from '../utils/dataFormatters';
import historyService from './historyService';

/**
 * Options for data injection
 */
export interface DataInjectionOptions {
  maxTokens?: number;
  detailedData?: boolean;
  includeRelated?: boolean;
  formatType?: 'concise' | 'detailed' | 'auto';
}

// Default token limits for different data types
const DEFAULT_LIMITS = {
  EMPLOYEE_TOKENS: 1000,
  SHIFT_TOKENS: 800,
  TASK_TOKENS: 800,
  JOB_TOKENS: 1000,
  CANDIDATE_TOKENS: 1200,
  RECOGNITION_TOKENS: 600,
  RELATED_TOKENS: 800,
  TOTAL_DATA_TOKENS: 4000
};

/**
 * Prompt Injection Service for preparing data-enhanced prompts
 */
class PromptInjectionService {
  /**
   * Retrieves and formats data for a query
   * @param query User query text
   * @param options Options for data injection
   * @returns Formatted data string for prompt injection
   */
  async prepareDataForPrompt(
    query: string,
    options: DataInjectionOptions = {}
  ): Promise<string> {
    try {
      // Analyze the query
      const analysis = await queryAnalysisService.analyzeQuery(query);
      
      // If data is not required, return empty string
      if (!analysis.requiresData) {
        return '';
      }
      
      // Retrieve relevant data
      const retrievedData = await dataRetrievalService.retrieveDataForQuery(query);
      
      // Format data for prompt inclusion
      return this.formatDataForPrompt(retrievedData, analysis, options);
    } catch (error) {
      console.error('Error preparing data for prompt:', error);
      return '';
    }
  }
  
  /**
   * Formats retrieved data for prompt inclusion
   * @param data Retrieved data
   * @param analysis Query analysis
   * @param options Formatting options
   * @returns Formatted data string
   */
  formatDataForPrompt(
    data: RetrievedData,
    analysis: QueryAnalysis,
    options: DataInjectionOptions
  ): string {
    // Default formatting options
    const formatType = options.formatType || 'auto';
    const maxTokens = options.maxTokens || DEFAULT_LIMITS.TOTAL_DATA_TOKENS;
    const includeRelated = options.includeRelated !== false;
    
    // Determine detail level based on format type or data complexity
    const detailedData = options.detailedData || 
      formatType === 'detailed' || 
      (formatType === 'auto' && this.shouldUseDetailedFormat(data, analysis));
    
    // Calculate available tokens for each section based on data size
    const tokenBudgets = this.calculateTokenBudgets(data, maxTokens);
    
    let formattedData = '';
    let usedTokens = 0;
    
    // Add employees data if available
    if (data.employees && data.employees.length > 0) {
      const employeeSection = this.formatEmployeeData(
        data.employees, 
        detailedData, 
        tokenBudgets.employeeTokens
      );
      
      const employeeTokens = historyService.estimateTokenCount(employeeSection);
      if (usedTokens + employeeTokens <= maxTokens) {
        formattedData += employeeSection;
        usedTokens += employeeTokens;
      }
    }
    
    // Add shifts data if available
    if (data.shifts && data.shifts.length > 0) {
      const shiftSection = this.formatShiftData(
        data.shifts, 
        detailedData, 
        tokenBudgets.shiftTokens
      );
      
      const shiftTokens = historyService.estimateTokenCount(shiftSection);
      if (usedTokens + shiftTokens <= maxTokens) {
        formattedData += shiftSection;
        usedTokens += shiftTokens;
      }
    }
    
    // Add employee task data if available
    if (data.employeeTasks && data.employeeTasks.length > 0) {
      const taskSection = this.formatTaskData(
        data.employeeTasks, 
        detailedData, 
        tokenBudgets.taskTokens
      );
      
      const taskTokens = historyService.estimateTokenCount(taskSection);
      if (usedTokens + taskTokens <= maxTokens) {
        formattedData += taskSection;
        usedTokens += taskTokens;
      }
    }
    
    // Add job data if available
    if (data.jobs && data.jobs.length > 0) {
      const jobSection = this.formatJobData(
        data.jobs, 
        detailedData, 
        tokenBudgets.jobTokens
      );
      
      const jobTokens = historyService.estimateTokenCount(jobSection);
      if (usedTokens + jobTokens <= maxTokens) {
        formattedData += jobSection;
        usedTokens += jobTokens;
      }
    }
    
    // Add candidate data if available
    if (data.candidates && data.candidates.length > 0) {
      const candidateSection = this.formatCandidateData(
        data.candidates, 
        detailedData, 
        tokenBudgets.candidateTokens
      );
      
      const candidateTokens = historyService.estimateTokenCount(candidateSection);
      if (usedTokens + candidateTokens <= maxTokens) {
        formattedData += candidateSection;
        usedTokens += candidateTokens;
      }
    }
    
    // Add recognition data if available
    if (data.recognition && data.recognition.length > 0) {
      const recognitionSection = this.formatRecognitionData(
        data.recognition, 
        detailedData, 
        tokenBudgets.recognitionTokens
      );
      
      const recognitionTokens = historyService.estimateTokenCount(recognitionSection);
      if (usedTokens + recognitionTokens <= maxTokens) {
        formattedData += recognitionSection;
        usedTokens += recognitionTokens;
      }
    }
    
    // Add relationship data if available and requested
    if (includeRelated && data.related && Object.keys(data.related).length > 0) {
      const relatedSection = this.formatRelatedData(
        data.related, 
        tokenBudgets.relatedTokens
      );
      
      const relatedTokens = historyService.estimateTokenCount(relatedSection);
      if (usedTokens + relatedTokens <= maxTokens) {
        formattedData += relatedSection;
        usedTokens += relatedTokens;
      }
    }
    
    return formattedData;
  }
  
  /**
   * Calculate token budgets for each data section
   * @param data Retrieved data
   * @param maxTokens Maximum tokens available
   * @returns Token budget for each section
   */
  private calculateTokenBudgets(data: RetrievedData, maxTokens: number): any {
    // Count number of items in each category
    const employeeCount = data.employees?.length || 0;
    const shiftCount = data.shifts?.length || 0;
    const taskCount = data.employeeTasks?.length || 0;
    const jobCount = data.jobs?.length || 0;
    const candidateCount = data.candidates?.length || 0;
    const recognitionCount = data.recognition?.length || 0;
    const hasRelated = data.related && Object.keys(data.related).length > 0;
    
    // Calculate total items
    const totalItems = employeeCount + shiftCount + taskCount + 
      jobCount + candidateCount + recognitionCount + (hasRelated ? 1 : 0);
    
    if (totalItems === 0) {
      return {
        employeeTokens: 0,
        shiftTokens: 0,
        taskTokens: 0,
        jobTokens: 0,
        candidateTokens: 0,
        recognitionTokens: 0,
        relatedTokens: 0
      };
    }
    
    // Allocate tokens proportionally based on item count and importance
    const employeeWeight = employeeCount * 2; // Employee data is high priority
    const shiftWeight = shiftCount * 1.5;
    const taskWeight = taskCount * 1.5;
    const jobWeight = jobCount * 2; // Job data is high priority
    const candidateWeight = candidateCount * 2; // Candidate data is high priority
    const recognitionWeight = recognitionCount * 1;
    const relatedWeight = hasRelated ? 1 : 0;
    
    const totalWeight = employeeWeight + shiftWeight + taskWeight + 
      jobWeight + candidateWeight + recognitionWeight + relatedWeight;
    
    // Calculate token budgets
    const employeeTokens = Math.min(
      DEFAULT_LIMITS.EMPLOYEE_TOKENS,
      Math.floor((employeeWeight / totalWeight) * maxTokens)
    );
    
    const shiftTokens = Math.min(
      DEFAULT_LIMITS.SHIFT_TOKENS,
      Math.floor((shiftWeight / totalWeight) * maxTokens)
    );
    
    const taskTokens = Math.min(
      DEFAULT_LIMITS.TASK_TOKENS,
      Math.floor((taskWeight / totalWeight) * maxTokens)
    );
    
    const jobTokens = Math.min(
      DEFAULT_LIMITS.JOB_TOKENS,
      Math.floor((jobWeight / totalWeight) * maxTokens)
    );
    
    const candidateTokens = Math.min(
      DEFAULT_LIMITS.CANDIDATE_TOKENS,
      Math.floor((candidateWeight / totalWeight) * maxTokens)
    );
    
    const recognitionTokens = Math.min(
      DEFAULT_LIMITS.RECOGNITION_TOKENS,
      Math.floor((recognitionWeight / totalWeight) * maxTokens)
    );
    
    const relatedTokens = Math.min(
      DEFAULT_LIMITS.RELATED_TOKENS,
      Math.floor((relatedWeight / totalWeight) * maxTokens)
    );
    
    return {
      employeeTokens,
      shiftTokens,
      taskTokens,
      jobTokens,
      candidateTokens,
      recognitionTokens,
      relatedTokens
    };
  }
  
  /**
   * Format employee data for prompt inclusion
   * @param employees Employee data
   * @param detailed Whether to use detailed format
   * @param tokenBudget Available token budget
   * @returns Formatted employee data string
   */
  private formatEmployeeData(
    employees: any[], 
    detailed: boolean, 
    tokenBudget: number
  ): string {
    if (employees.length === 0) return '';
    
    let formatted = '\n## Employee Data\n\n';
    
    // If too many employees, use summary format
    if (employees.length > 5 || !detailed) {
      formatted += dataFormatters.formatEmployeeList(employees);
      return formatted;
    }
    
    // Use detailed format for each employee
    for (const employee of employees) {
      const employeeStr = dataFormatters.formatEmployee(employee);
      
      // Check if adding this employee exceeds token budget
      if (historyService.estimateTokenCount(formatted + employeeStr) > tokenBudget) {
        formatted += `\n... and ${employees.length - formatted.split('ID:').length + 1} more employees.`;
        break;
      }
      
      formatted += employeeStr + '\n';
    }
    
    return formatted;
  }
  
  /**
   * Format shift data for prompt inclusion
   * @param shifts Shift data
   * @param detailed Whether to use detailed format
   * @param tokenBudget Available token budget
   * @returns Formatted shift data string
   */
  private formatShiftData(
    shifts: any[], 
    detailed: boolean, 
    tokenBudget: number
  ): string {
    if (shifts.length === 0) return '';
    
    let formatted = '\n## Schedule Data\n\n';
    
    // If too many shifts, use summary format
    if (shifts.length > 3 || !detailed) {
      formatted += dataFormatters.formatShiftList(shifts);
      return formatted;
    }
    
    // Use detailed format for each shift
    for (const shift of shifts) {
      const shiftStr = dataFormatters.formatShift(shift);
      
      // Check if adding this shift exceeds token budget
      if (historyService.estimateTokenCount(formatted + shiftStr) > tokenBudget) {
        formatted += `\n... and ${shifts.length - formatted.split('Shift ID:').length + 1} more shifts.`;
        break;
      }
      
      formatted += shiftStr + '\n';
    }
    
    return formatted;
  }
  
  /**
   * Format task data for prompt inclusion
   * @param tasks Task data
   * @param detailed Whether to use detailed format
   * @param tokenBudget Available token budget
   * @returns Formatted task data string
   */
  private formatTaskData(
    tasks: any[], 
    detailed: boolean, 
    tokenBudget: number
  ): string {
    if (tasks.length === 0) return '';
    
    let formatted = '\n## Task Data\n\n';
    
    // If not using detailed format, create a summary
    if (!detailed) {
      const pendingTasks = tasks.filter(t => t.status === 'pending' || t.status === 'in_progress');
      const completedTasks = tasks.filter(t => t.status === 'completed');
      
      formatted += `Total tasks: ${tasks.length}\n`;
      formatted += `Pending tasks: ${pendingTasks.length}\n`;
      formatted += `Completed tasks: ${completedTasks.length}\n\n`;
      
      // List task titles by priority
      const highPriority = tasks.filter(t => t.priority === 'high');
      if (highPriority.length > 0) {
        formatted += 'High priority tasks:\n';
        highPriority.forEach(t => {
          formatted += `- ${t.title} (${t.status}, due: ${t.dueDate})\n`;
        });
      }
      
      return formatted;
    }
    
    // Use detailed format for each task
    for (const task of tasks) {
      const taskStr = dataFormatters.formatEmployeeTask(task);
      
      // Check if adding this task exceeds token budget
      if (historyService.estimateTokenCount(formatted + taskStr) > tokenBudget) {
        formatted += `\n... and ${tasks.length - formatted.split('Task ID:').length + 1} more tasks.`;
        break;
      }
      
      formatted += taskStr + '\n';
    }
    
    return formatted;
  }
  
  /**
   * Format job data for prompt inclusion
   * @param jobs Job data
   * @param detailed Whether to use detailed format
   * @param tokenBudget Available token budget
   * @returns Formatted job data string
   */
  private formatJobData(
    jobs: any[], 
    detailed: boolean, 
    tokenBudget: number
  ): string {
    if (jobs.length === 0) return '';
    
    let formatted = '\n## Job Data\n\n';
    
    // If too many jobs or not detailed, use summary format
    if (jobs.length > 3 || !detailed) {
      formatted += dataFormatters.formatJobList(jobs);
      return formatted;
    }
    
    // Use detailed format for each job
    for (const job of jobs) {
      const jobStr = dataFormatters.formatJob(job);
      
      // Check if adding this job exceeds token budget
      if (historyService.estimateTokenCount(formatted + jobStr) > tokenBudget) {
        formatted += `\n... and ${jobs.length - formatted.split('Job ID:').length + 1} more jobs.`;
        break;
      }
      
      formatted += jobStr + '\n';
    }
    
    return formatted;
  }
  
  /**
   * Format candidate data for prompt inclusion
   * @param candidates Candidate data
   * @param detailed Whether to use detailed format
   * @param tokenBudget Available token budget
   * @returns Formatted candidate data string
   */
  private formatCandidateData(
    candidates: any[], 
    detailed: boolean, 
    tokenBudget: number
  ): string {
    if (candidates.length === 0) return '';
    
    let formatted = '\n## Candidate Data\n\n';
    
    // If too many candidates, use pipeline summary format
    if (candidates.length > 3 || !detailed) {
      formatted += dataFormatters.formatCandidatePipelineSummary(candidates);
      
      // Add a brief list of candidates
      formatted += '\nCandidates:\n';
      candidates.slice(0, 5).forEach(candidate => {
        formatted += `- ${candidate.firstName} ${candidate.lastName} (${candidate.stage}) for job ${candidate.jobId}\n`;
      });
      
      if (candidates.length > 5) {
        formatted += `... and ${candidates.length - 5} more candidates.\n`;
      }
      
      return formatted;
    }
    
    // Use detailed format for each candidate
    for (const candidate of candidates) {
      const candidateStr = dataFormatters.formatCandidate(candidate);
      
      // Check if adding this candidate exceeds token budget
      if (historyService.estimateTokenCount(formatted + candidateStr) > tokenBudget) {
        formatted += `\n... and ${candidates.length - formatted.split('Candidate ID:').length + 1} more candidates.`;
        break;
      }
      
      formatted += candidateStr + '\n';
    }
    
    return formatted;
  }
  
  /**
   * Format recognition data for prompt inclusion
   * @param recognitions Recognition data
   * @param detailed Whether to use detailed format
   * @param tokenBudget Available token budget
   * @returns Formatted recognition data string
   */
  private formatRecognitionData(
    recognitions: any[], 
    detailed: boolean, 
    tokenBudget: number
  ): string {
    if (recognitions.length === 0) return '';
    
    let formatted = '\n## Recognition Data\n\n';
    
    // If not using detailed format, create a summary
    if (!detailed) {
      formatted += `Total recognitions: ${recognitions.length}\n\n`;
      
      // List recent recognitions
      formatted += 'Recent recognitions:\n';
      recognitions.slice(0, 3).forEach(r => {
        const recipient = r.employeeId || (r.teamName ? `Team: ${r.teamName}` : 'Unknown');
        formatted += `- ${r.type} recognition to ${recipient} (${r.date}): ${r.description.substring(0, 50)}${r.description.length > 50 ? '...' : ''}\n`;
      });
      
      if (recognitions.length > 3) {
        formatted += `... and ${recognitions.length - 3} more recognitions.\n`;
      }
      
      return formatted;
    }
    
    // Use detailed format for each recognition
    for (const recognition of recognitions) {
      const recognitionStr = dataFormatters.formatRecognition(recognition);
      
      // Check if adding this recognition exceeds token budget
      if (historyService.estimateTokenCount(formatted + recognitionStr) > tokenBudget) {
        formatted += `\n... and ${recognitions.length - formatted.split('Recognition ID:').length + 1} more recognitions.`;
        break;
      }
      
      formatted += recognitionStr + '\n';
    }
    
    return formatted;
  }
  
  /**
   * Format related data for prompt inclusion
   * @param related Related data object
   * @param tokenBudget Available token budget
   * @returns Formatted related data string
   */
  private formatRelatedData(
    related: any, 
    tokenBudget: number
  ): string {
    if (!related || Object.keys(related).length === 0) return '';
    
    let formatted = '\n## Relationship Data\n\n';
    
    // Format manager relationships
    if (related.managers && Object.keys(related.managers).length > 0) {
      formatted += 'Manager relationships:\n';
      
      for (const [employeeId, manager] of Object.entries(related.managers)) {
        formatted += `- Employee ${employeeId} reports to ${(manager as any).firstName} ${(manager as any).lastName} (${(manager as any).id})\n`;
      }
      
      formatted += '\n';
    }
    
    // Format direct reports relationships
    if (related.directReports && Object.keys(related.directReports).length > 0) {
      formatted += 'Direct reports:\n';
      
      for (const [managerId, reports] of Object.entries(related.directReports)) {
        const reportCount = (reports as any[]).length;
        formatted += `- Manager ${managerId} has ${reportCount} direct reports\n`;
      }
      
      formatted += '\n';
    }
    
    // Format employee-shift relationships (summarized)
    if (related.employeeShifts && Object.keys(related.employeeShifts).length > 0) {
      formatted += 'Employee shift assignments:\n';
      
      for (const [employeeId, shifts] of Object.entries(related.employeeShifts)) {
        const shiftCount = (shifts as any[]).length;
        formatted += `- Employee ${employeeId} has ${shiftCount} shifts\n`;
      }
      
      formatted += '\n';
    }
    
    // Format employee-task relationships (summarized)
    if (related.employeeTasks && Object.keys(related.employeeTasks).length > 0) {
      formatted += 'Employee task assignments:\n';
      
      for (const [employeeId, tasks] of Object.entries(related.employeeTasks)) {
        const taskCount = (tasks as any[]).length;
        const pendingCount = (tasks as any[]).filter((t: any) => 
          t.status === 'pending' || t.status === 'in_progress'
        ).length;
        
        formatted += `- Employee ${employeeId} has ${taskCount} tasks (${pendingCount} pending)\n`;
      }
      
      formatted += '\n';
    }
    
    // Format job-candidate relationships (summarized)
    if (related.jobCandidates && Object.keys(related.jobCandidates).length > 0) {
      formatted += 'Job candidate pipelines:\n';
      
      for (const [jobId, candidates] of Object.entries(related.jobCandidates)) {
        const candidateCount = (candidates as any[]).length;
        formatted += `- Job ${jobId} has ${candidateCount} candidates\n`;
      }
      
      formatted += '\n';
    }
    
    // Check if we're exceeding token budget
    if (historyService.estimateTokenCount(formatted) > tokenBudget) {
      // Truncate if too long
      formatted = formatted.substring(0, Math.floor(tokenBudget / 3)) + '\n... (relationship data truncated for brevity)';
    }
    
    return formatted;
  }
  
  /**
   * Determine if detailed format should be used
   * @param data Retrieved data
   * @param analysis Query analysis
   * @returns Whether to use detailed format
   */
  private shouldUseDetailedFormat(data: RetrievedData, analysis: QueryAnalysis): boolean {
    // Count total entities
    const totalEntities = 
      (data.employees?.length || 0) +
      (data.candidates?.length || 0) +
      (data.jobs?.length || 0);
    
    // Use detailed format if:
    // 1. Few entities are present (specific query)
    // 2. High confidence in analysis
    // 3. Primary intent requires detailed information
    return (
      totalEntities <= 5 ||
      analysis.confidenceScore > 0.8 ||
      this.intentRequiresDetailedData(analysis.primaryIntent.category)
    );
  }
  
  /**
   * Check if an intent typically requires detailed data
   * @param intentCategory Intent category
   * @returns Whether the intent requires detailed data
   */
  private intentRequiresDetailedData(intentCategory: string): boolean {
    // These intents usually benefit from detailed information
    const detailedIntents = [
      'employee_info',
      'schedule_management',
      'candidate_management',
      'interview_process',
      'hiring_workflow'
    ];
    
    return detailedIntents.includes(intentCategory);
  }
}

// Export a singleton instance
const promptInjectionService = new PromptInjectionService();
export default promptInjectionService;