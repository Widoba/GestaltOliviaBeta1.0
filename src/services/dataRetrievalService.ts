/**
 * Service for retrieving data based on query analysis
 */
import dataService from './dataService';
import queryAnalysisService, { 
  DetectedEntity, 
  EntityType, 
  QueryAnalysis,
  IntentCategory
} from './queryAnalysisService';

/**
 * Interface for retrieved data result
 */
export interface RetrievedData {
  employees?: any[];
  shifts?: any[];
  employeeTasks?: any[];
  talentTasks?: any[];
  recognitionTasks?: any[];
  shiftTasks?: any[];
  jobs?: any[];
  candidates?: any[];
  recognition?: any[];
  related?: any;
  [key: string]: any;
}

/**
 * Data Retrieval Service for fetching and preparing relevant data
 */
class DataRetrievalService {
  // Cache for frequently accessed data
  private dataCache: Map<string, any> = new Map();
  private cacheTTL: number = 5 * 60 * 1000; // 5 minutes cache TTL
  private cacheTimestamps: Map<string, number> = new Map();
  
  /**
   * Retrieves data relevant to a query
   * @param query User query text
   * @returns Retrieved data for prompt inclusion
   */
  async retrieveDataForQuery(query: string): Promise<RetrievedData> {
    try {
      // Analyze the query
      const analysis = await queryAnalysisService.analyzeQuery(query);
      
      // If no data is required, return empty result
      if (!analysis.requiresData) {
        return {};
      }
      
      // Retrieve data based on analysis
      return this.retrieveDataForAnalysis(analysis);
    } catch (error) {
      console.error('Error retrieving data for query:', error);
      return {};
    }
  }
  
  /**
   * Retrieves data based on query analysis
   * @param analysis Query analysis result
   * @returns Retrieved data object
   */
  async retrieveDataForAnalysis(analysis: QueryAnalysis): Promise<RetrievedData> {
    const result: RetrievedData = {};
    
    // Process entities to retrieve related data
    await this.processEntities(analysis.entities, result);
    
    // Process intents to retrieve additional context data
    await this.processIntents(analysis.primaryIntent, analysis.secondaryIntents, result);
    
    // Resolve relationships between retrieved data
    this.resolveRelationships(result);
    
    return result;
  }
  
  /**
   * Process detected entities to retrieve related data
   * @param entities Detected entities
   * @param result Data result to populate
   */
  private async processEntities(entities: DetectedEntity[], result: RetrievedData): Promise<void> {
    // Process employee entities
    const employeeEntities = entities.filter(e => e.type === EntityType.EMPLOYEE);
    if (employeeEntities.length > 0) {
      await this.retrieveEmployeeData(employeeEntities, result);
    }
    
    // Process candidate entities
    const candidateEntities = entities.filter(e => e.type === EntityType.CANDIDATE);
    if (candidateEntities.length > 0) {
      await this.retrieveCandidateData(candidateEntities, result);
    }
    
    // Process job entities
    const jobEntities = entities.filter(e => e.type === EntityType.JOB);
    if (jobEntities.length > 0) {
      await this.retrieveJobData(jobEntities, result);
    }
    
    // Process department entities
    const departmentEntities = entities.filter(e => e.type === EntityType.DEPARTMENT);
    if (departmentEntities.length > 0) {
      await this.retrieveDepartmentData(departmentEntities, result);
    }
    
    // Process date and time period entities
    const dateEntities = entities.filter(e => 
      e.type === EntityType.DATE || e.type === EntityType.TIME_PERIOD
    );
    if (dateEntities.length > 0) {
      await this.retrieveDateRelatedData(dateEntities, result);
    }
  }
  
  /**
   * Retrieve employee-related data
   * @param entities Employee entities
   * @param result Data result to populate
   */
  private async retrieveEmployeeData(entities: DetectedEntity[], result: RetrievedData): Promise<void> {
    // Initialize arrays if needed
    result.employees = result.employees || [];
    
    // Process each entity
    for (const entity of entities) {
      if (entity.id) {
        // Get employee by ID
        try {
          const cacheKey = `employee_${entity.id}`;
          let employee = this.getCachedData(cacheKey);
          
          if (!employee) {
            employee = await dataService.getEmployeeById(entity.id);
            this.setCachedData(cacheKey, employee);
          }
          
          if (employee) {
            // Add to result if not already included
            if (!result.employees.some(e => e.id === employee.id)) {
              result.employees.push(employee);
            }
          }
        } catch (error) {
          console.error(`Error retrieving employee data for ${entity.id}:`, error);
        }
      } else {
        // Try to find by name
        try {
          const employees = await dataService.getEmployees();
          const matchingEmployees = employees.filter(e => 
            `${e.firstName} ${e.lastName}`.toLowerCase().includes(entity.value.toLowerCase()) ||
            e.firstName.toLowerCase().includes(entity.value.toLowerCase()) ||
            e.lastName.toLowerCase().includes(entity.value.toLowerCase())
          );
          
          // Add matching employees
          for (const employee of matchingEmployees) {
            if (!result.employees.some(e => e.id === employee.id)) {
              result.employees.push(employee);
            }
          }
        } catch (error) {
          console.error(`Error searching for employee by name:`, error);
        }
      }
    }
  }
  
  /**
   * Retrieve candidate-related data
   * @param entities Candidate entities
   * @param result Data result to populate
   */
  private async retrieveCandidateData(entities: DetectedEntity[], result: RetrievedData): Promise<void> {
    // Initialize arrays if needed
    result.candidates = result.candidates || [];
    
    // Process each entity
    for (const entity of entities) {
      if (entity.id) {
        // Get candidate by ID
        try {
          const cacheKey = `candidate_${entity.id}`;
          let candidate = this.getCachedData(cacheKey);
          
          if (!candidate) {
            candidate = await dataService.getCandidateById(entity.id);
            this.setCachedData(cacheKey, candidate);
          }
          
          if (candidate) {
            // Add to result if not already included
            if (!result.candidates.some(c => c.id === candidate.id)) {
              result.candidates.push(candidate);
              
              // Also get the related job
              if (candidate.jobId && !result.jobs) {
                await this.retrieveJobData([{
                  type: EntityType.JOB,
                  value: candidate.jobId,
                  originalText: candidate.jobId,
                  id: candidate.jobId,
                  confidence: 1.0
                }], result);
              }
            }
          }
        } catch (error) {
          console.error(`Error retrieving candidate data for ${entity.id}:`, error);
        }
      } else {
        // Try to find by name
        try {
          const candidates = await dataService.getCandidates();
          const matchingCandidates = candidates.filter(c => 
            `${c.firstName} ${c.lastName}`.toLowerCase().includes(entity.value.toLowerCase()) ||
            c.firstName.toLowerCase().includes(entity.value.toLowerCase()) ||
            c.lastName.toLowerCase().includes(entity.value.toLowerCase())
          );
          
          // Add matching candidates
          for (const candidate of matchingCandidates) {
            if (!result.candidates.some(c => c.id === candidate.id)) {
              result.candidates.push(candidate);
              
              // Also get the related job
              if (candidate.jobId && !result.jobs) {
                await this.retrieveJobData([{
                  type: EntityType.JOB,
                  value: candidate.jobId,
                  originalText: candidate.jobId,
                  id: candidate.jobId,
                  confidence: 1.0
                }], result);
              }
            }
          }
        } catch (error) {
          console.error(`Error searching for candidate by name:`, error);
        }
      }
    }
  }
  
  /**
   * Retrieve job-related data
   * @param entities Job entities
   * @param result Data result to populate
   */
  private async retrieveJobData(entities: DetectedEntity[], result: RetrievedData): Promise<void> {
    // Initialize arrays if needed
    result.jobs = result.jobs || [];
    
    // Process each entity
    for (const entity of entities) {
      if (entity.id) {
        // Get job by ID
        try {
          const cacheKey = `job_${entity.id}`;
          let job = this.getCachedData(cacheKey);
          
          if (!job) {
            job = await dataService.getJobById(entity.id);
            this.setCachedData(cacheKey, job);
          }
          
          if (job) {
            // Add to result if not already included
            if (!result.jobs.some(j => j.id === job.id)) {
              result.jobs.push(job);
            }
          }
        } catch (error) {
          console.error(`Error retrieving job data for ${entity.id}:`, error);
        }
      } else {
        // Try to find by title
        try {
          const jobs = await dataService.getJobs();
          const matchingJobs = jobs.filter(j => 
            j.title.toLowerCase().includes(entity.value.toLowerCase())
          );
          
          // Add matching jobs
          for (const job of matchingJobs) {
            if (!result.jobs.some(j => j.id === job.id)) {
              result.jobs.push(job);
            }
          }
        } catch (error) {
          console.error(`Error searching for job by title:`, error);
        }
      }
    }
  }
  
  /**
   * Retrieve department-related data
   * @param entities Department entities
   * @param result Data result to populate
   */
  private async retrieveDepartmentData(entities: DetectedEntity[], result: RetrievedData): Promise<void> {
    // Initialize arrays if needed
    result.employees = result.employees || [];
    
    // Process each entity
    for (const entity of entities) {
      // Get employees in department
      try {
        const employees = await dataService.getEmployeesByDepartment(entity.value);
        
        // Add matching employees
        for (const employee of employees) {
          if (!result.employees.some(e => e.id === employee.id)) {
            result.employees.push(employee);
          }
        }
      } catch (error) {
        console.error(`Error retrieving department data:`, error);
      }
    }
  }
  
  /**
   * Retrieve date-related data
   * @param entities Date entities
   * @param result Data result to populate
   */
  private async retrieveDateRelatedData(entities: DetectedEntity[], result: RetrievedData): Promise<void> {
    // Initialize arrays if needed
    result.shifts = result.shifts || [];
    
    // Process date entities
    for (const entity of entities) {
      if (entity.type === EntityType.DATE) {
        // For exact dates, get shifts on that date
        try {
          const shifts = await dataService.getShiftsByDateRange(entity.value, entity.value);
          
          // Add matching shifts
          for (const shift of shifts) {
            if (!result.shifts.some(s => s.id === shift.id)) {
              result.shifts.push(shift);
            }
          }
        } catch (error) {
          console.error(`Error retrieving shifts for date:`, error);
        }
      } else if (entity.type === EntityType.TIME_PERIOD) {
        // For time periods with explicit dates
        if (entity.metadata?.startDate && entity.metadata?.endDate) {
          try {
            const shifts = await dataService.getShiftsByDateRange(
              entity.metadata.startDate, 
              entity.metadata.endDate
            );
            
            // Add matching shifts
            for (const shift of shifts) {
              if (!result.shifts.some(s => s.id === shift.id)) {
                result.shifts.push(shift);
              }
            }
          } catch (error) {
            console.error(`Error retrieving shifts for date range:`, error);
          }
        } else {
          // For relative time periods (this week, next month, etc.)
          // Get current date range based on the value
          const dateRange = this.getDateRangeForTimePeriod(entity.value);
          
          if (dateRange) {
            try {
              const shifts = await dataService.getShiftsByDateRange(
                dateRange.startDate, 
                dateRange.endDate
              );
              
              // Add matching shifts
              for (const shift of shifts) {
                if (!result.shifts.some(s => s.id === shift.id)) {
                  result.shifts.push(shift);
                }
              }
            } catch (error) {
              console.error(`Error retrieving shifts for time period:`, error);
            }
          }
        }
      }
    }
  }
  
  /**
   * Calculate date range for a time period value
   * @param timePeriodValue Time period value (e.g., 'this_week', 'next_month')
   * @returns Date range object or null if invalid
   */
  private getDateRangeForTimePeriod(timePeriodValue: string): { startDate: string, endDate: string } | null {
    const today = new Date();
    let startDate: Date;
    let endDate: Date;
    
    switch (timePeriodValue) {
      case 'today':
        startDate = today;
        endDate = today;
        break;
        
      case 'tomorrow':
        startDate = new Date(today);
        startDate.setDate(today.getDate() + 1);
        endDate = startDate;
        break;
        
      case 'yesterday':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 1);
        endDate = startDate;
        break;
        
      case 'this_week':
        startDate = new Date(today);
        const dayOfWeek = today.getDay();
        startDate.setDate(today.getDate() - dayOfWeek); // Start of week (Sunday)
        
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6); // End of week (Saturday)
        break;
        
      case 'next_week':
        startDate = new Date(today);
        const nextWeekDayOfWeek = today.getDay();
        startDate.setDate(today.getDate() - nextWeekDayOfWeek + 7); // Start of next week
        
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6); // End of next week
        break;
        
      case 'last_week':
        startDate = new Date(today);
        const lastWeekDayOfWeek = today.getDay();
        startDate.setDate(today.getDate() - lastWeekDayOfWeek - 7); // Start of last week
        
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6); // End of last week
        break;
        
      case 'this_month':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        break;
        
      case 'next_month':
        startDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        endDate = new Date(today.getFullYear(), today.getMonth() + 2, 0);
        break;
        
      case 'last_month':
        startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        endDate = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
        
      default:
        return null;
    }
    
    // Format as ISO strings (YYYY-MM-DD)
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    };
  }
  
  /**
   * Process intents to retrieve additional context data
   * @param primaryIntent Primary detected intent
   * @param secondaryIntents Secondary detected intents
   * @param result Data result to populate
   */
  private async processIntents(
    primaryIntent: any, 
    secondaryIntents: any[], 
    result: RetrievedData
  ): Promise<void> {
    // If employee is already fetched, get related employee data
    if (result.employees && result.employees.length > 0) {
      await this.retrieveEmployeeRelatedData(result.employees, primaryIntent, result);
    }
    
    // If candidate is already fetched, get related candidate data
    if (result.candidates && result.candidates.length > 0) {
      await this.retrieveCandidateRelatedData(result.candidates, primaryIntent, result);
    }
    
    // If job is already fetched, get related job data
    if (result.jobs && result.jobs.length > 0) {
      await this.retrieveJobRelatedData(result.jobs, primaryIntent, result);
    }
    
    // If no specific entities were found, get contextual data based on intent
    if (!result.employees?.length && !result.candidates?.length && !result.jobs?.length) {
      await this.retrieveContextualData(primaryIntent, secondaryIntents, result);
    }
  }
  
  /**
   * Retrieve additional data related to employees
   * @param employees Employee data
   * @param primaryIntent Primary detected intent
   * @param result Data result to populate
   */
  private async retrieveEmployeeRelatedData(
    employees: any[], 
    primaryIntent: any, 
    result: RetrievedData
  ): Promise<void> {
    // Initialize arrays if needed
    result.shifts = result.shifts || [];
    result.employeeTasks = result.employeeTasks || [];
    result.recognition = result.recognition || [];
    
    // Process each employee
    for (const employee of employees) {
      // Get shifts based on intent category
      if (
        primaryIntent.category === IntentCategory.SCHEDULE_MANAGEMENT ||
        primaryIntent.subIntents?.includes('view_schedule')
      ) {
        try {
          const shifts = await dataService.getShiftsByEmployeeId(employee.id);
          
          // Add matching shifts
          for (const shift of shifts) {
            if (!result.shifts.some(s => s.id === shift.id)) {
              result.shifts.push(shift);
            }
          }
        } catch (error) {
          console.error(`Error retrieving shifts for employee ${employee.id}:`, error);
        }
      }
      
      // Get tasks based on intent category
      if (
        primaryIntent.category === IntentCategory.TASK_MANAGEMENT ||
        primaryIntent.subIntents?.includes('view_tasks')
      ) {
        try {
          const tasks = await dataService.getEmployeeTasksByEmployeeId(employee.id);
          
          // Add matching tasks
          for (const task of tasks) {
            if (!result.employeeTasks.some(t => t.id === task.id)) {
              result.employeeTasks.push(task);
            }
          }
        } catch (error) {
          console.error(`Error retrieving tasks for employee ${employee.id}:`, error);
        }
      }
      
      // Get recognition based on intent category
      if (
        primaryIntent.category === IntentCategory.RECOGNITION ||
        primaryIntent.subIntents?.includes('view_recognitions')
      ) {
        try {
          const recognitions = await dataService.getRecognitionsByEmployeeId(employee.id);
          
          // Add matching recognitions
          for (const recognition of recognitions) {
            if (!result.recognition.some(r => r.id === recognition.id)) {
              result.recognition.push(recognition);
            }
          }
        } catch (error) {
          console.error(`Error retrieving recognitions for employee ${employee.id}:`, error);
        }
      }
    }
  }
  
  /**
   * Retrieve additional data related to candidates
   * @param candidates Candidate data
   * @param primaryIntent Primary detected intent
   * @param result Data result to populate
   */
  private async retrieveCandidateRelatedData(
    candidates: any[], 
    primaryIntent: any, 
    result: RetrievedData
  ): Promise<void> {
    // Initialize arrays if needed
    result.jobs = result.jobs || [];
    
    // Process each candidate
    for (const candidate of candidates) {
      // Get related job
      if (candidate.jobId) {
        try {
          const cacheKey = `job_${candidate.jobId}`;
          let job = this.getCachedData(cacheKey);
          
          if (!job) {
            job = await dataService.getJobById(candidate.jobId);
            this.setCachedData(cacheKey, job);
          }
          
          if (job && !result.jobs.some(j => j.id === job.id)) {
            result.jobs.push(job);
          }
        } catch (error) {
          console.error(`Error retrieving job for candidate ${candidate.id}:`, error);
        }
      }
    }
  }
  
  /**
   * Retrieve additional data related to jobs
   * @param jobs Job data
   * @param primaryIntent Primary detected intent
   * @param result Data result to populate
   */
  private async retrieveJobRelatedData(
    jobs: any[], 
    primaryIntent: any, 
    result: RetrievedData
  ): Promise<void> {
    // Initialize arrays if needed
    result.candidates = result.candidates || [];
    
    // Process each job
    for (const job of jobs) {
      // Get candidates for this job
      if (
        primaryIntent.category === IntentCategory.CANDIDATE_MANAGEMENT ||
        primaryIntent.category === IntentCategory.INTERVIEW_PROCESS ||
        primaryIntent.category === IntentCategory.HIRING_WORKFLOW ||
        primaryIntent.subIntents?.includes('view_candidates')
      ) {
        try {
          const candidates = await dataService.getCandidatesByJobId(job.id);
          
          // Add matching candidates
          for (const candidate of candidates) {
            if (!result.candidates.some(c => c.id === candidate.id)) {
              result.candidates.push(candidate);
            }
          }
        } catch (error) {
          console.error(`Error retrieving candidates for job ${job.id}:`, error);
        }
      }
    }
  }
  
  /**
   * Retrieve contextual data based on intent when no specific entities are found
   * @param primaryIntent Primary detected intent
   * @param secondaryIntents Secondary detected intents
   * @param result Data result to populate
   */
  private async retrieveContextualData(
    primaryIntent: any, 
    secondaryIntents: any[], 
    result: RetrievedData
  ): Promise<void> {
    switch (primaryIntent.category) {
      case IntentCategory.SCHEDULE_MANAGEMENT:
        // Get recent/upcoming shifts
        await this.retrieveRecentShifts(result);
        break;
        
      case IntentCategory.TASK_MANAGEMENT:
        // Get recent/pending tasks
        await this.retrieveRecentTasks(result);
        break;
        
      case IntentCategory.JOB_MANAGEMENT:
        // Get open jobs
        await this.retrieveOpenJobs(result);
        break;
        
      case IntentCategory.CANDIDATE_MANAGEMENT:
        // Get active candidates
        await this.retrieveActiveCandidates(result);
        break;
        
      case IntentCategory.INTERVIEW_PROCESS:
        // Get upcoming interviews
        await this.retrieveUpcomingInterviews(result);
        break;
    }
  }
  
  /**
   * Retrieve recent or upcoming shifts
   * @param result Data result to populate
   */
  private async retrieveRecentShifts(result: RetrievedData): Promise<void> {
    try {
      // Get today's date
      const today = new Date().toISOString().split('T')[0];
      
      // Get end date (7 days from now)
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 7);
      const endDateStr = endDate.toISOString().split('T')[0];
      
      // Get shifts for the next week
      const shifts = await dataService.getShiftsByDateRange(today, endDateStr);
      
      // Initialize shifts array if needed
      result.shifts = result.shifts || [];
      
      // Add shifts (limit to 10 for context window efficiency)
      result.shifts = [...shifts.slice(0, 10)];
    } catch (error) {
      console.error('Error retrieving recent shifts:', error);
    }
  }
  
  /**
   * Retrieve recent or pending tasks
   * @param result Data result to populate
   */
  private async retrieveRecentTasks(result: RetrievedData): Promise<void> {
    try {
      // Get pending or in-progress tasks
      const tasks = await dataService.getEmployeeTasksByStatus('pending');
      const inProgressTasks = await dataService.getEmployeeTasksByStatus('in_progress');
      
      // Initialize tasks array if needed
      result.employeeTasks = result.employeeTasks || [];
      
      // Add tasks (limit to 10 for context window efficiency)
      result.employeeTasks = [...tasks, ...inProgressTasks].slice(0, 10);
    } catch (error) {
      console.error('Error retrieving recent tasks:', error);
    }
  }
  
  /**
   * Retrieve open jobs
   * @param result Data result to populate
   */
  private async retrieveOpenJobs(result: RetrievedData): Promise<void> {
    try {
      // Get open jobs
      const jobs = await dataService.getJobsByStatus('open');
      
      // Initialize jobs array if needed
      result.jobs = result.jobs || [];
      
      // Add jobs (limit to 10 for context window efficiency)
      result.jobs = [...jobs.slice(0, 10)];
    } catch (error) {
      console.error('Error retrieving open jobs:', error);
    }
  }
  
  /**
   * Retrieve active candidates
   * @param result Data result to populate
   */
  private async retrieveActiveCandidates(result: RetrievedData): Promise<void> {
    try {
      // Get active candidates
      const candidates = await dataService.getCandidatesByStage('interview');
      const inOfferStage = await dataService.getCandidatesByStage('offer');
      
      // Initialize candidates array if needed
      result.candidates = result.candidates || [];
      
      // Add candidates (limit to 10 for context window efficiency)
      result.candidates = [...candidates, ...inOfferStage].slice(0, 10);
      
      // If candidates are found, also get their jobs
      if (result.candidates.length > 0) {
        // Get unique job IDs
        const jobIds = [...new Set(result.candidates.map(c => c.jobId))];
        
        // Initialize jobs array if needed
        result.jobs = result.jobs || [];
        
        // Get jobs
        for (const jobId of jobIds) {
          try {
            const job = await dataService.getJobById(jobId);
            if (job && !result.jobs.some(j => j.id === job.id)) {
              result.jobs.push(job);
            }
          } catch (error) {
            console.error(`Error retrieving job ${jobId}:`, error);
          }
        }
      }
    } catch (error) {
      console.error('Error retrieving active candidates:', error);
    }
  }
  
  /**
   * Retrieve upcoming interviews
   * @param result Data result to populate
   */
  private async retrieveUpcomingInterviews(result: RetrievedData): Promise<void> {
    try {
      // For now, we'll use candidates in the interview stage as a proxy
      const interviewCandidates = await dataService.getCandidatesByStage('interview');
      
      // Initialize candidates array if needed
      result.candidates = result.candidates || [];
      
      // Add candidates (limit to 10 for context window efficiency)
      result.candidates = [...interviewCandidates.slice(0, 10)];
      
      // If candidates are found, also get their jobs
      if (result.candidates.length > 0) {
        // Get unique job IDs
        const jobIds = [...new Set(result.candidates.map(c => c.jobId))];
        
        // Initialize jobs array if needed
        result.jobs = result.jobs || [];
        
        // Get jobs
        for (const jobId of jobIds) {
          try {
            const job = await dataService.getJobById(jobId);
            if (job && !result.jobs.some(j => j.id === job.id)) {
              result.jobs.push(job);
            }
          } catch (error) {
            console.error(`Error retrieving job ${jobId}:`, error);
          }
        }
      }
    } catch (error) {
      console.error('Error retrieving upcoming interviews:', error);
    }
  }
  
  /**
   * Resolve relationships between retrieved data items
   * @param result Data result to enhance with relationships
   */
  private resolveRelationships(result: RetrievedData): void {
    // Initialize the related object if not present
    result.related = result.related || {};
    
    // Resolve employee-manager relationships
    if (result.employees && result.employees.length > 0) {
      // Create a map of employee IDs to employees
      const employeeMap = new Map();
      result.employees.forEach(emp => employeeMap.set(emp.id, emp));
      
      // Find managers and direct reports
      result.employees.forEach(employee => {
        // Set manager relationship
        if (employee.manager && employeeMap.has(employee.manager)) {
          // Add manager to related data
          result.related.managers = result.related.managers || {};
          result.related.managers[employee.id] = employeeMap.get(employee.manager);
        }
        
        // Set direct reports relationship
        const directReports = result.employees.filter(emp => emp.manager === employee.id);
        if (directReports.length > 0) {
          // Add direct reports to related data
          result.related.directReports = result.related.directReports || {};
          result.related.directReports[employee.id] = directReports;
        }
      });
    }
    
    // Resolve employee-shift relationships
    if (result.employees && result.shifts && result.shifts.length > 0) {
      result.related.employeeShifts = {};
      
      // Group shifts by employee ID
      result.shifts.forEach(shift => {
        const employeeId = shift.employeeId;
        result.related.employeeShifts[employeeId] = result.related.employeeShifts[employeeId] || [];
        result.related.employeeShifts[employeeId].push(shift);
      });
    }
    
    // Resolve employee-task relationships
    if (result.employees && result.employeeTasks && result.employeeTasks.length > 0) {
      result.related.employeeTasks = {};
      
      // Group tasks by employee ID
      result.employeeTasks.forEach(task => {
        const employeeId = task.employeeId;
        result.related.employeeTasks[employeeId] = result.related.employeeTasks[employeeId] || [];
        result.related.employeeTasks[employeeId].push(task);
      });
    }
    
    // Resolve job-candidate relationships
    if (result.jobs && result.candidates && result.candidates.length > 0) {
      result.related.jobCandidates = {};
      
      // Group candidates by job ID
      result.candidates.forEach(candidate => {
        const jobId = candidate.jobId;
        result.related.jobCandidates[jobId] = result.related.jobCandidates[jobId] || [];
        result.related.jobCandidates[jobId].push(candidate);
      });
    }
  }
  
  /**
   * Get cached data if available and not expired
   * @param key Cache key
   * @returns Cached data or undefined if not available
   */
  private getCachedData(key: string): any {
    if (this.dataCache.has(key)) {
      const timestamp = this.cacheTimestamps.get(key) || 0;
      const now = Date.now();
      
      // Check if cache is still valid
      if (now - timestamp < this.cacheTTL) {
        return this.dataCache.get(key);
      }
    }
    
    return undefined;
  }
  
  /**
   * Set data in cache with current timestamp
   * @param key Cache key
   * @param data Data to cache
   */
  private setCachedData(key: string, data: any): void {
    this.dataCache.set(key, data);
    this.cacheTimestamps.set(key, Date.now());
  }
}

// Export a singleton instance
const dataRetrievalService = new DataRetrievalService();
export default dataRetrievalService;