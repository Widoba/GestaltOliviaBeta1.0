/**
 * Prompt Optimization Service
 * Optimizes prompt size and structure to reduce token usage while preserving functionality
 */
import { AssistantType } from '../contexts/ChatContext';
import { RetrievedData } from './dataRetrievalService';

/**
 * Interface for prompt optimization options
 */
export interface PromptOptimizationOptions {
  maxPromptSize?: number;         // Maximum size in characters
  maxDataItems?: number;          // Maximum number of data items per type
  prioritizeRecent?: boolean;     // Whether to prioritize recent data
  includeDataStats?: boolean;     // Whether to include data statistics
  compressionLevel?: 'low' | 'medium' | 'high'; // Level of compression
}

/**
 * Interface for prompt optimization metrics
 */
interface PromptOptimizationMetrics {
  originalSize: number;
  optimizedSize: number;
  reductionPercentage: number;
  tokenSavings: number;
  dataIncluded: string[];
  compressionTechniques: string[];
}

/**
 * Interface for prompt optimization options
 */
interface PromptOptimizationOptions {
  maxPromptSize?: number;         // Maximum size in characters
  maxDataItems?: number;          // Maximum number of data items per type
  prioritizeRecent?: boolean;     // Whether to prioritize recent data
  includeDataStats?: boolean;     // Whether to include data statistics
  compressionLevel?: 'low' | 'medium' | 'high'; // Level of compression
}

/**
 * Prompt Optimization Service for reducing token usage
 */
class PromptOptimizationService {
  // Default options for optimization
  private defaultOptions: PromptOptimizationOptions = {
    maxPromptSize: 12000,        // 12KB max for system prompt 
    maxDataItems: 10,            // Maximum 10 items per data type
    prioritizeRecent: true,      // Prioritize recent data
    includeDataStats: true,      // Include data statistics
    compressionLevel: 'medium'   // Medium compression by default
  };
  
  /**
   * Optimize a system prompt for token efficiency
   * @param prompt Original system prompt
   * @param data Retrieved data to include
   * @param options Optimization options
   * @returns Optimized prompt
   */
  optimizeSystemPrompt(
    prompt: string, 
    data?: RetrievedData,
    options?: PromptOptimizationOptions
  ): { 
    optimizedPrompt: string;
    metrics: PromptOptimizationMetrics;
  } {
    const startTime = Date.now();
    const opts = { ...this.defaultOptions, ...options };
    
    // Track optimization metrics
    const metrics: PromptOptimizationMetrics = {
      originalSize: prompt.length,
      optimizedSize: 0,
      reductionPercentage: 0,
      tokenSavings: 0,
      dataIncluded: [],
      compressionTechniques: []
    };
    
    // If no data provided, just optimize the prompt structure
    if (!data || Object.keys(data).length === 0) {
      const optimizedPrompt = this.optimizePromptStructure(prompt, opts);
      
      // Update metrics
      metrics.optimizedSize = optimizedPrompt.length;
      metrics.reductionPercentage = (1 - (optimizedPrompt.length / prompt.length)) * 100;
      metrics.tokenSavings = Math.floor((prompt.length - optimizedPrompt.length) * 0.25); // Approx token reduction
      
      return { optimizedPrompt, metrics };
    }
    
    // Step 1: Optimize the prompt structure
    let optimizedPrompt = this.optimizePromptStructure(prompt, opts);
    metrics.compressionTechniques.push('structure_optimization');
    
    // Step 2: Prepare optimized data for inclusion
    const { optimizedData, dataMetrics } = this.optimizeData(data, opts);
    
    // Step 3: Format the optimized data for inclusion
    const formattedData = this.formatDataForPrompt(optimizedData, opts);
    
    // Step 4: Build the final prompt with optimized data
    const dataSectionMarker = '## DATA CONTEXT\n';
    
    // Find the position to inject data
    const dataMarkerIndex = optimizedPrompt.indexOf(dataSectionMarker);
    
    if (dataMarkerIndex !== -1) {
      // Replace placeholder with optimized data
      const beforeData = optimizedPrompt.substring(0, dataMarkerIndex + dataSectionMarker.length);
      const afterDataMarker = optimizedPrompt.substring(dataMarkerIndex + dataSectionMarker.length);
      
      // Find the end of the data section
      const nextSectionIndex = afterDataMarker.indexOf('##');
      const afterData = nextSectionIndex !== -1 
        ? afterDataMarker.substring(nextSectionIndex)
        : afterDataMarker;
      
      // Build the full optimized prompt
      optimizedPrompt = beforeData + formattedData + '\n' + afterData;
    } else {
      // If no marker found, append data at the end
      optimizedPrompt += '\n\n' + dataSectionMarker + formattedData;
    }
    
    // Update metrics
    metrics.optimizedSize = optimizedPrompt.length;
    metrics.reductionPercentage = (1 - (optimizedPrompt.length / prompt.length)) * 100;
    metrics.tokenSavings = Math.floor((prompt.length - optimizedPrompt.length) * 0.25); // Approx token reduction
    metrics.dataIncluded = dataMetrics.includedTypes;
    metrics.compressionTechniques.push(...dataMetrics.compressionTechniques);
    
    return { optimizedPrompt, metrics };
  }
  
  /**
   * Optimizes prompt structure to reduce redundancy and verbosity
   * @param prompt Original prompt
   * @param options Optimization options
   * @returns Structurally optimized prompt
   */
  private optimizePromptStructure(prompt: string, options: PromptOptimizationOptions): string {
    let optimizedPrompt = prompt;
    
    // Apply compression techniques based on level
    switch (options.compressionLevel) {
      case 'high':
        // High compression - aggressive optimization
        optimizedPrompt = this.applyHighCompression(optimizedPrompt);
        break;
        
      case 'medium':
        // Medium compression - balanced optimization
        optimizedPrompt = this.applyMediumCompression(optimizedPrompt);
        break;
        
      case 'low':
        // Low compression - minimal optimization
        optimizedPrompt = this.applyLowCompression(optimizedPrompt);
        break;
        
      default:
        // Default to medium compression
        optimizedPrompt = this.applyMediumCompression(optimizedPrompt);
    }
    
    return optimizedPrompt;
  }
  
  /**
   * Apply low-level compression techniques
   * @param prompt Original prompt
   * @returns Prompt with low compression applied
   */
  private applyLowCompression(prompt: string): string {
    // Remove redundant blank lines (more than 2 consecutive)
    let optimized = prompt.replace(/\n{3,}/g, '\n\n');
    
    // Trim overlong section separators
    optimized = optimized.replace(/[-=_]{5,}/g, '----');
    
    // Simplify list markers for consistency
    optimized = optimized.replace(/^\s*[•●♦◆]\s+/gm, '- ');
    
    return optimized;
  }
  
  /**
   * Apply medium-level compression techniques
   * @param prompt Original prompt
   * @returns Prompt with medium compression applied
   */
  private applyMediumCompression(prompt: string): string {
    // Start with low compression
    let optimized = this.applyLowCompression(prompt);
    
    // Condense multiple spaces
    optimized = optimized.replace(/[ \t]{2,}/g, ' ');
    
    // Shorten section headers while maintaining readability
    optimized = optimized.replace(/^(#+)\s*(.+?)\s*:$/gm, '$1 $2:');
    
    // Optimize bullet points for lists to be more concise
    optimized = optimized.replace(/^\s*-\s+(.+)$/gm, '- $1');
    
    // Remove duplicate examples if multiple examples convey the same point
    // This is simplified - in production we'd need more sophisticated duplicate detection
    return optimized;
  }
  
  /**
   * Apply high-level compression techniques
   * @param prompt Original prompt
   * @returns Prompt with high compression applied
   */
  private applyHighCompression(prompt: string): string {
    // Start with medium compression
    let optimized = this.applyMediumCompression(prompt);
    
    // Simplify section headers to minimum viable format
    optimized = optimized.replace(/^(#+)\s+(.+?)\s*:?$/gm, '$1$2');
    
    // Replace verbose instructions with more concise versions
    optimized = optimized.replace(
      /\bYou should always\b/gi, 
      'Always'
    );
    
    optimized = optimized.replace(
      /\bIt is important to\b/gi, 
      'Important:'
    );
    
    // Reduce explanation verbosity
    optimized = optimized.replace(
      /\bFor example, (if|when) (.+?), you should (.+?)\./gi,
      'Ex: $2 → $3.'
    );
    
    // Condense multi-line items into single lines where possible
    // This requires careful handling to not break markdown or structure
    
    return optimized;
  }
  
  /**
   * Optimize data for inclusion in prompt
   * @param data Retrieved data
   * @param options Optimization options
   * @returns Optimized data and metrics
   */
  private optimizeData(
    data: RetrievedData, 
    options: PromptOptimizationOptions
  ): { 
    optimizedData: RetrievedData;
    dataMetrics: {
      includedTypes: string[];
      compressionTechniques: string[];
    }
  } {
    const optimizedData: RetrievedData = {};
    const dataMetrics = {
      includedTypes: [],
      compressionTechniques: ['data_filtering', 'limit_per_type']
    };
    
    // For each data type, apply optimizations
    if (data.employees && data.employees.length > 0) {
      optimizedData.employees = this.filterDataItems(data.employees, 'employees', options);
      dataMetrics.includedTypes.push('employees');
    }
    
    if (data.shifts && data.shifts.length > 0) {
      optimizedData.shifts = this.filterDataItems(data.shifts, 'shifts', options);
      dataMetrics.includedTypes.push('shifts');
    }
    
    if (data.employeeTasks && data.employeeTasks.length > 0) {
      optimizedData.employeeTasks = this.filterDataItems(data.employeeTasks, 'employeeTasks', options);
      dataMetrics.includedTypes.push('employeeTasks');
    }
    
    if (data.talentTasks && data.talentTasks.length > 0) {
      optimizedData.talentTasks = this.filterDataItems(data.talentTasks, 'talentTasks', options);
      dataMetrics.includedTypes.push('talentTasks');
    }
    
    if (data.recognitionTasks && data.recognitionTasks.length > 0) {
      optimizedData.recognitionTasks = this.filterDataItems(data.recognitionTasks, 'recognitionTasks', options);
      dataMetrics.includedTypes.push('recognitionTasks');
    }
    
    if (data.shiftTasks && data.shiftTasks.length > 0) {
      optimizedData.shiftTasks = this.filterDataItems(data.shiftTasks, 'shiftTasks', options);
      dataMetrics.includedTypes.push('shiftTasks');
    }
    
    if (data.jobs && data.jobs.length > 0) {
      optimizedData.jobs = this.filterDataItems(data.jobs, 'jobs', options);
      dataMetrics.includedTypes.push('jobs');
    }
    
    if (data.candidates && data.candidates.length > 0) {
      optimizedData.candidates = this.filterDataItems(data.candidates, 'candidates', options);
      dataMetrics.includedTypes.push('candidates');
    }
    
    if (data.recognition && data.recognition.length > 0) {
      optimizedData.recognition = this.filterDataItems(data.recognition, 'recognition', options);
      dataMetrics.includedTypes.push('recognition');
    }
    
    // Include relationship data if present
    if (data.related) {
      optimizedData.related = data.related;
      dataMetrics.includedTypes.push('relationships');
    }
    
    // If we're applying high compression, optimize object structures too
    if (options.compressionLevel === 'high') {
      this.compressDataObjects(optimizedData);
      dataMetrics.compressionTechniques.push('object_compression');
    }
    
    // If we're applying medium or high compression, remove null/undefined values
    if (options.compressionLevel === 'medium' || options.compressionLevel === 'high') {
      this.removeEmptyValues(optimizedData);
      dataMetrics.compressionTechniques.push('empty_value_removal');
    }
    
    return { optimizedData, dataMetrics };
  }
  
  /**
   * Filter and prioritize data items based on options
   * @param items Data items to filter
   * @param type Type of data being filtered
   * @param options Optimization options
   * @returns Filtered data items
   */
  private filterDataItems<T>(items: T[], type: string, options: PromptOptimizationOptions): T[] {
    // If there are no items, return empty array
    if (!items || items.length === 0) {
      return [];
    }
    
    let filteredItems = [...items];
    
    // 1. Apply type-specific filtering to reduce volume
    filteredItems = this.applyTypeSpecificFiltering(filteredItems, type);
    
    // 2. Prioritize items if needed
    if (options.prioritizeRecent) {
      filteredItems = this.prioritizeItems(filteredItems, type);
    }
    
    // 3. Limit the number of items
    const limit = options.maxDataItems || 10;
    if (filteredItems.length > limit) {
      filteredItems = filteredItems.slice(0, limit);
    }
    
    return filteredItems;
  }
  
  /**
   * Apply type-specific filtering to reduce data volume
   * @param items Items to filter
   * @param type Type of data being filtered
   * @returns Filtered items
   */
  private applyTypeSpecificFiltering<T>(items: T[], type: string): T[] {
    // Different filtering strategies based on data type
    switch (type) {
      case 'employees':
        // For employees, filter out non-essential fields for most use cases
        return items.map((item: any) => ({
          id: item.id,
          firstName: item.firstName,
          lastName: item.lastName,
          email: item.email,
          department: item.department,
          position: item.position,
          manager: item.manager,
          location: item.location
        })) as unknown as T[];
        
      case 'shifts':
        // For shifts, prioritize current and future shifts
        return items.filter((item: any) => {
          // Keep only upcoming or current shifts
          const today = new Date().toISOString().split('T')[0];
          return item.startDate >= today;
        });
        
      case 'employeeTasks':
      case 'talentTasks':
      case 'recognitionTasks':
      case 'shiftTasks':
        // For tasks, prioritize pending and high-priority tasks
        return items.filter((item: any) => {
          return item.status === 'pending' || item.priority === 'high';
        });
        
      case 'jobs':
        // For jobs, prioritize active jobs
        return items.filter((item: any) => {
          return item.status === 'open' || item.status === 'active';
        });
        
      case 'candidates':
        // For candidates, prioritize active candidates
        return items.filter((item: any) => {
          return item.status === 'active' || item.stage === 'interview' || item.stage === 'offer';
        });
        
      default:
        // For other types, return all items
        return items;
    }
  }
  
  /**
   * Prioritize items based on recency or importance
   * @param items Items to prioritize
   * @param type Type of data being prioritized
   * @returns Prioritized items
   */
  private prioritizeItems<T>(items: T[], type: string): T[] {
    if (items.length <= 1) return items;
    
    const itemsWithPriority = [...items];
    
    // Different prioritization strategies based on data type
    switch (type) {
      case 'shifts':
        // Prioritize shifts by start date (ascending)
        return itemsWithPriority.sort((a: any, b: any) => {
          return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
        });
        
      case 'employeeTasks':
      case 'talentTasks': 
      case 'recognitionTasks':
      case 'shiftTasks':
        // Prioritize tasks by due date and priority
        return itemsWithPriority.sort((a: any, b: any) => {
          // First by priority (high > medium > low)
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
          if (priorityDiff !== 0) return priorityDiff;
          
          // Then by due date (ascending)
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        });
        
      case 'jobs':
        // Prioritize jobs by posting date (most recent first)
        return itemsWithPriority.sort((a: any, b: any) => {
          return new Date(b.postingDate).getTime() - new Date(a.postingDate).getTime();
        });
        
      case 'candidates':
        // Prioritize candidates by stage and application date
        return itemsWithPriority.sort((a: any, b: any) => {
          // First by stage (offer > interview > application)
          const stageOrder = { offer: 0, interview: 1, application: 2 };
          const stageDiff = (stageOrder[a.stage] || 3) - (stageOrder[b.stage] || 3);
          if (stageDiff !== 0) return stageDiff;
          
          // Then by application date (most recent first)
          return new Date(b.applicationDate).getTime() - new Date(a.applicationDate).getTime();
        });
        
      case 'recognition':
        // Prioritize recognitions by date (most recent first)
        return itemsWithPriority.sort((a: any, b: any) => {
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        });
        
      default:
        // For other types, maintain original order
        return itemsWithPriority;
    }
  }
  
  /**
   * Compress data objects by removing non-essential fields
   * @param data Data to compress
   */
  private compressDataObjects(data: RetrievedData): void {
    // Define essential fields for each data type
    const essentialFields: Record<string, string[]> = {
      employees: ['id', 'firstName', 'lastName', 'position', 'department', 'manager'],
      shifts: ['id', 'employeeId', 'startDate', 'endDate', 'status'],
      employeeTasks: ['id', 'title', 'status', 'dueDate', 'priority', 'employeeId'],
      talentTasks: ['id', 'title', 'status', 'dueDate', 'priority', 'managerId'],
      jobs: ['id', 'title', 'department', 'status', 'location', 'hiringManager'],
      candidates: ['id', 'firstName', 'lastName', 'jobId', 'stage', 'status']
    };
    
    // For each data type, keep only essential fields
    for (const [key, items] of Object.entries(data)) {
      if (Array.isArray(items) && items.length > 0 && essentialFields[key]) {
        data[key] = items.map((item: any) => {
          const slimItem: Record<string, any> = {};
          
          for (const field of essentialFields[key]) {
            if (item[field] !== undefined) {
              slimItem[field] = item[field];
            }
          }
          
          return slimItem;
        });
      }
    }
  }
  
  /**
   * Remove empty values (null, undefined, empty strings, empty arrays) from data
   * @param data Data to process
   */
  private removeEmptyValues(data: RetrievedData): void {
    // Process each data type
    for (const key in data) {
      if (Array.isArray(data[key])) {
        // For array values, process each item
        data[key] = (data[key] as any[]).map((item: any) => {
          if (typeof item !== 'object' || item === null) return item;
          
          // Remove empty fields from the item
          const cleanItem: Record<string, any> = {};
          
          for (const field in item) {
            const value = item[field];
            
            // Skip empty values
            if (value === null || value === undefined || value === '') continue;
            if (Array.isArray(value) && value.length === 0) continue;
            
            cleanItem[field] = value;
          }
          
          return cleanItem;
        });
      }
    }
  }
  
  /**
   * Format data into prompt-compatible string format
   * @param data Optimized data
   * @param options Optimization options
   * @returns Formatted data string
   */
  private formatDataForPrompt(data: RetrievedData, options: PromptOptimizationOptions): string {
    let formattedData = '';
    
    // If no data, return minimal placeholder
    if (!data || Object.keys(data).filter(k => k !== 'related').length === 0) {
      return 'No specific data available for this query.\n';
    }
    
    // Add data sections for each data type
    if (data.employees && data.employees.length > 0) {
      formattedData += this.formatEmployees(data.employees, options);
    }
    
    if (data.shifts && data.shifts.length > 0) {
      formattedData += this.formatShifts(data.shifts, options);
    }
    
    if (data.employeeTasks && data.employeeTasks.length > 0) {
      formattedData += this.formatTasks('Employee Tasks', data.employeeTasks, options);
    }
    
    if (data.talentTasks && data.talentTasks.length > 0) {
      formattedData += this.formatTasks('Talent Tasks', data.talentTasks, options);
    }
    
    if (data.recognitionTasks && data.recognitionTasks.length > 0) {
      formattedData += this.formatTasks('Recognition Tasks', data.recognitionTasks, options);
    }
    
    if (data.shiftTasks && data.shiftTasks.length > 0) {
      formattedData += this.formatTasks('Shift Tasks', data.shiftTasks, options);
    }
    
    if (data.jobs && data.jobs.length > 0) {
      formattedData += this.formatJobs(data.jobs, options);
    }
    
    if (data.candidates && data.candidates.length > 0) {
      formattedData += this.formatCandidates(data.candidates, options);
    }
    
    if (data.recognition && data.recognition.length > 0) {
      formattedData += this.formatRecognition(data.recognition, options);
    }
    
    // If include stats option is enabled, add summary statistics
    if (options.includeDataStats) {
      formattedData += this.generateDataStats(data);
    }
    
    return formattedData;
  }
  
  /**
   * Format employees data
   */
  private formatEmployees(employees: any[], options: PromptOptimizationOptions): string {
    let output = '### Employees\n';
    
    if (employees.length > 3 || options.compressionLevel === 'high') {
      // Summarized format for many employees or high compression
      output += `${employees.length} employees found.\n`;
      
      // List employees in compact format
      for (const employee of employees) {
        output += `- ${employee.firstName} ${employee.lastName} (${employee.id}): ${employee.position} in ${employee.department}\n`;
      }
    } else {
      // Detailed format for few employees
      for (const employee of employees) {
        output += `- ${employee.firstName} ${employee.lastName} (${employee.id})\n`;
        output += `  Position: ${employee.position}\n`;
        output += `  Department: ${employee.department}\n`;
        if (employee.manager) output += `  Manager: ${employee.manager}\n`;
        if (employee.location) output += `  Location: ${employee.location}\n`;
        output += '\n';
      }
    }
    
    return output;
  }
  
  /**
   * Format shifts data
   */
  private formatShifts(shifts: any[], options: PromptOptimizationOptions): string {
    let output = '### Shifts\n';
    
    if (shifts.length > 3 || options.compressionLevel === 'high') {
      // Summarized format for many shifts or high compression
      output += `${shifts.length} shifts found.\n`;
      
      // List shifts in compact format
      for (const shift of shifts) {
        output += `- Shift ${shift.id}: ${shift.employeeId}, ${shift.startDate} to ${shift.endDate}, Status: ${shift.status}\n`;
      }
    } else {
      // Detailed format for few shifts
      for (const shift of shifts) {
        output += `- Shift ${shift.id}\n`;
        output += `  Employee: ${shift.employeeId}\n`;
        output += `  Dates: ${shift.startDate} to ${shift.endDate}\n`;
        output += `  Status: ${shift.status}\n`;
        if (shift.location) output += `  Location: ${shift.location}\n`;
        output += '\n';
      }
    }
    
    return output;
  }
  
  /**
   * Format tasks data
   */
  private formatTasks(title: string, tasks: any[], options: PromptOptimizationOptions): string {
    let output = `### ${title}\n`;
    
    if (tasks.length > 3 || options.compressionLevel === 'high') {
      // Summarized format for many tasks or high compression
      output += `${tasks.length} tasks found.\n`;
      
      // Count tasks by status
      const pendingCount = tasks.filter(t => t.status === 'pending').length;
      const inProgressCount = tasks.filter(t => t.status === 'in_progress').length;
      const completedCount = tasks.filter(t => t.status === 'completed').length;
      
      output += `Status: ${pendingCount} pending, ${inProgressCount} in progress, ${completedCount} completed.\n`;
      
      // List tasks in compact format
      for (const task of tasks) {
        output += `- ${task.title} (${task.id}): ${task.status}, Priority: ${task.priority}, Due: ${task.dueDate}\n`;
      }
    } else {
      // Detailed format for few tasks
      for (const task of tasks) {
        output += `- Task: ${task.title} (${task.id})\n`;
        output += `  Status: ${task.status}\n`;
        output += `  Priority: ${task.priority}\n`;
        output += `  Due Date: ${task.dueDate}\n`;
        if (task.description) output += `  Description: ${task.description}\n`;
        output += '\n';
      }
    }
    
    return output;
  }
  
  /**
   * Format jobs data
   */
  private formatJobs(jobs: any[], options: PromptOptimizationOptions): string {
    let output = '### Jobs\n';
    
    if (jobs.length > 3 || options.compressionLevel === 'high') {
      // Summarized format for many jobs or high compression
      output += `${jobs.length} jobs found.\n`;
      
      // Count jobs by status
      const openCount = jobs.filter(j => j.status === 'open').length;
      const closedCount = jobs.filter(j => j.status === 'closed').length;
      
      output += `Status: ${openCount} open, ${closedCount} closed.\n`;
      
      // List jobs in compact format
      for (const job of jobs) {
        output += `- ${job.title} (${job.id}): ${job.department}, Status: ${job.status}, Location: ${job.location}\n`;
      }
    } else {
      // Detailed format for few jobs
      for (const job of jobs) {
        output += `- Job: ${job.title} (${job.id})\n`;
        output += `  Department: ${job.department}\n`;
        output += `  Location: ${job.location}\n`;
        output += `  Status: ${job.status}\n`;
        if (job.hiringManager) output += `  Hiring Manager: ${job.hiringManager}\n`;
        output += '\n';
      }
    }
    
    return output;
  }
  
  /**
   * Format candidates data
   */
  private formatCandidates(candidates: any[], options: PromptOptimizationOptions): string {
    let output = '### Candidates\n';
    
    if (candidates.length > 3 || options.compressionLevel === 'high') {
      // Summarized format for many candidates or high compression
      output += `${candidates.length} candidates found.\n`;
      
      // Count candidates by stage
      const applicationCount = candidates.filter(c => c.stage === 'application').length;
      const interviewCount = candidates.filter(c => c.stage === 'interview').length;
      const offerCount = candidates.filter(c => c.stage === 'offer').length;
      
      output += `Stages: ${applicationCount} in application, ${interviewCount} in interview, ${offerCount} in offer.\n`;
      
      // List candidates in compact format
      for (const candidate of candidates) {
        output += `- ${candidate.firstName} ${candidate.lastName} (${candidate.id}): Stage: ${candidate.stage}, Job: ${candidate.jobId}\n`;
      }
    } else {
      // Detailed format for few candidates
      for (const candidate of candidates) {
        output += `- Candidate: ${candidate.firstName} ${candidate.lastName} (${candidate.id})\n`;
        output += `  Job: ${candidate.jobId}\n`;
        output += `  Stage: ${candidate.stage}\n`;
        output += `  Status: ${candidate.status}\n`;
        output += '\n';
      }
    }
    
    return output;
  }
  
  /**
   * Format recognition data
   */
  private formatRecognition(recognitions: any[], options: PromptOptimizationOptions): string {
    let output = '### Recognition\n';
    
    if (recognitions.length > 3 || options.compressionLevel === 'high') {
      // Summarized format for many recognitions or high compression
      output += `${recognitions.length} recognitions found.\n`;
      
      // List recognitions in compact format
      for (const recognition of recognitions) {
        if (recognition.employeeId) {
          output += `- ${recognition.type} for ${recognition.employeeId}: ${recognition.category} on ${recognition.date}\n`;
        } else if (recognition.teamId) {
          output += `- ${recognition.type} for team ${recognition.teamName}: ${recognition.category} on ${recognition.date}\n`;
        }
      }
    } else {
      // Detailed format for few recognitions
      for (const recognition of recognitions) {
        output += `- Recognition ID: ${recognition.id}\n`;
        output += `  Type: ${recognition.type}\n`;
        output += `  Date: ${recognition.date}\n`;
        output += `  Category: ${recognition.category}\n`;
        if (recognition.employeeId) output += `  Employee: ${recognition.employeeId}\n`;
        if (recognition.teamId) output += `  Team: ${recognition.teamName} (${recognition.teamId})\n`;
        if (recognition.description) output += `  Description: ${recognition.description}\n`;
        output += '\n';
      }
    }
    
    return output;
  }
  
  /**
   * Generate data statistics summary
   * @param data Data to summarize
   * @returns Formatted data statistics
   */
  private generateDataStats(data: RetrievedData): string {
    let output = '\n### Data Summary\n';
    
    // Count items by type
    const counts: Record<string, number> = {};
    let totalItems = 0;
    
    for (const [key, items] of Object.entries(data)) {
      if (Array.isArray(items)) {
        counts[key] = items.length;
        totalItems += items.length;
      }
    }
    
    output += `Total items: ${totalItems}\n`;
    
    // Add counts by type
    for (const [key, count] of Object.entries(counts)) {
      if (count > 0) {
        const readableKey = key.replace(/([A-Z])/g, ' $1').toLowerCase();
        output += `- ${readableKey}: ${count}\n`;
      }
    }
    
    return output;
  }
  
  /**
   * Optimize a message for token efficiency before sending to API
   * @param message Message to optimize
   * @param assistantType Current assistant type
   * @returns Optimized message
   */
  optimizeMessage(
    message: string,
    assistantType: AssistantType
  ): string {
    // For messages, we generally want to preserve original meaning,
    // so we apply lighter optimization techniques
    
    // Remove redundant blank lines
    let optimized = message.replace(/\n{3,}/g, '\n\n');
    
    // Condense multiple spaces
    optimized = optimized.replace(/[ \t]{2,}/g, ' ');
    
    // Different optimizations based on assistant type
    if (assistantType === 'employee') {
      // Employee assistant specific optimizations
      // Nothing special needed for now
    } else if (assistantType === 'talent') {
      // Talent assistant specific optimizations
      // Nothing special needed for now
    } else {
      // Unified assistant optimizations
      // Nothing special needed for now
    }
    
    return optimized;
  }
}

// Export a singleton instance
const promptOptimizationService = new PromptOptimizationService();
export default promptOptimizationService;