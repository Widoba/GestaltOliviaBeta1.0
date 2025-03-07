/**
 * Optimized Data Retrieval Service with enhanced performance
 */
import dataService from './dataService';
import optimizedDataService from './optimizedDataService';
import cacheService from './cacheService';
import queryAnalysisService, { 
  DetectedEntity, 
  EntityType, 
  QueryAnalysis,
  IntentCategory
} from './queryAnalysisService';
import { RetrievedData } from './dataRetrievalService';

/**
 * Performance metrics for data retrieval
 */
interface DataRetrievalMetrics {
  queriesProcessed: number;
  cacheHits: number;
  cacheMisses: number;
  averageProcessingTime: number;
  entityCounts: Record<string, number>; // Counts by entity type
  intentCounts: Record<string, number>; // Counts by intent category
  lastUpdated: Date;
}

/**
 * Optimized Data Retrieval Service
 * Improves performance of data retrieval for prompt inclusion
 */
class OptimizedDataRetrievalService {
  // Performance metrics
  private metrics: DataRetrievalMetrics = {
    queriesProcessed: 0,
    cacheHits: 0,
    cacheMisses: 0,
    averageProcessingTime: 0,
    entityCounts: {},
    intentCounts: {},
    lastUpdated: new Date()
  };
  
  // Keep track of recent response times for metrics
  private processingTimes: number[] = [];
  
  /**
   * Retrieves data relevant to a query with optimized performance
   * @param query User query text
   * @returns Retrieved data for prompt inclusion
   */
  async retrieveDataForQuery(query: string): Promise<RetrievedData> {
    const startTime = Date.now();
    
    try {
      // Check the cache first with a query hash as the key
      const queryHash = this.hashQuery(query);
      const cachedResult = cacheService.get<RetrievedData>(`query_${queryHash}`, 'query');
      
      if (cachedResult) {
        // Update metrics for cache hit
        this.updateMetrics(startTime, true);
        return cachedResult;
      }
      
      // Analyze the query to determine intent and entities
      const analysis = await queryAnalysisService.analyzeQuery(query);
      
      // Update metrics for entity and intent types
      this.trackEntityTypes(analysis.entities);
      this.trackIntentType(analysis.primaryIntent.category);
      
      // If no data is required, return empty result
      if (!analysis.requiresData) {
        const emptyResult = {};
        this.updateMetrics(startTime, false);
        return emptyResult;
      }
      
      // Retrieve data based on analysis
      const result = await this.retrieveDataForAnalysis(analysis);
      
      // Cache the result (5 minute TTL for query results)
      cacheService.set(`query_${queryHash}`, result, {
        category: 'query',
        ttl: 5 * 60 * 1000
      });
      
      // Update metrics for cache miss
      this.updateMetrics(startTime, false);
      
      return result;
    } catch (error) {
      console.error('Error retrieving data for query:', error);
      return {};
    }
  }
  
  /**
   * Retrieves data based on query analysis using optimized data service
   * @param analysis Query analysis result
   * @returns Retrieved data object
   */
  private async retrieveDataForAnalysis(analysis: QueryAnalysis): Promise<RetrievedData> {
    const result: RetrievedData = {};
    
    // Use Promise.all to fetch different data types in parallel
    await Promise.all([
      this.processEntities(analysis.entities, result),
      this.processIntents(analysis.primaryIntent, analysis.secondaryIntents, result)
    ]);
    
    // Resolve relationships between retrieved data
    this.resolveRelationships(result);
    
    return result;
  }
  
  /**
   * Process detected entities to retrieve related data (optimized)
   * @param entities Detected entities
   * @param result Data result to populate
   */
  private async processEntities(entities: DetectedEntity[], result: RetrievedData): Promise<void> {
    // Create promise arrays for each entity type to fetch in parallel
    const employeePromises: Promise<void>[] = [];
    const candidatePromises: Promise<void>[] = [];
    const jobPromises: Promise<void>[] = [];
    const departmentPromises: Promise<void>[] = [];
    const datePromises: Promise<void>[] = [];
    
    // Process employee entities
    const employeeEntities = entities.filter(e => e.type === EntityType.EMPLOYEE);
    if (employeeEntities.length > 0) {
      employeePromises.push(this.retrieveEmployeeData(employeeEntities, result));
    }
    
    // Process candidate entities
    const candidateEntities = entities.filter(e => e.type === EntityType.CANDIDATE);
    if (candidateEntities.length > 0) {
      candidatePromises.push(this.retrieveCandidateData(candidateEntities, result));
    }
    
    // Process job entities
    const jobEntities = entities.filter(e => e.type === EntityType.JOB);
    if (jobEntities.length > 0) {
      jobPromises.push(this.retrieveJobData(jobEntities, result));
    }
    
    // Process department entities
    const departmentEntities = entities.filter(e => e.type === EntityType.DEPARTMENT);
    if (departmentEntities.length > 0) {
      departmentPromises.push(this.retrieveDepartmentData(departmentEntities, result));
    }
    
    // Process date and time period entities
    const dateEntities = entities.filter(e => 
      e.type === EntityType.DATE || e.type === EntityType.TIME_PERIOD
    );
    if (dateEntities.length > 0) {
      datePromises.push(this.retrieveDateRelatedData(dateEntities, result));
    }
    
    // Execute all promises in parallel for each entity type group
    await Promise.all([
      // Wait for all employee promises
      Promise.all(employeePromises),
      // Wait for all candidate promises
      Promise.all(candidatePromises),
      // Wait for all job promises
      Promise.all(jobPromises),
      // Wait for all department promises
      Promise.all(departmentPromises),
      // Wait for all date promises
      Promise.all(datePromises)
    ]);
  }
  
  /**
   * Retrieve employee-related data (optimized)
   * @param entities Employee entities
   * @param result Data result to populate
   */
  private async retrieveEmployeeData(entities: DetectedEntity[], result: RetrievedData): Promise<void> {
    // Initialize arrays if needed
    result.employees = result.employees || [];
    
    // Create a batch of promises for each entity
    const employeePromises = entities.map(async (entity) => {
      try {
        if (entity.id) {
          // Get employee by ID using optimized service
          const employee = await optimizedDataService.getEmployeeById(entity.id);
          
          if (employee && !result.employees!.some(e => e.id === employee.id)) {
            result.employees!.push(employee);
          }
        } else {
          // Try to find by name - get all employees and filter
          const employees = await optimizedDataService.getEmployees();
          const matchingEmployees = employees.filter(e => 
            `${e.firstName} ${e.lastName}`.toLowerCase().includes(entity.value.toLowerCase()) ||
            e.firstName.toLowerCase().includes(entity.value.toLowerCase()) ||
            e.lastName.toLowerCase().includes(entity.value.toLowerCase())
          );
          
          // Add matching employees
          for (const employee of matchingEmployees) {
            if (!result.employees!.some(e => e.id === employee.id)) {
              result.employees!.push(employee);
            }
          }
        }
      } catch (error) {
        console.error(`Error retrieving employee data:`, error);
      }
    });
    
    // Wait for all employee promises to resolve
    await Promise.all(employeePromises);
  }
  
  /**
   * Retrieve candidate-related data (optimized)
   * @param entities Candidate entities
   * @param result Data result to populate
   */
  private async retrieveCandidateData(entities: DetectedEntity[], result: RetrievedData): Promise<void> {
    // Initialize arrays if needed
    result.candidates = result.candidates || [];
    
    // Create a batch of promises for each entity
    const candidatePromises = entities.map(async (entity) => {
      try {
        if (entity.id) {
          // Get candidate by ID using optimized service
          const candidate = await optimizedDataService.getCandidateById(entity.id);
          
          if (candidate && !result.candidates!.some(c => c.id === candidate.id)) {
            result.candidates!.push(candidate);
            
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
        } else {
          // Try to find by name - get all candidates and filter
          const candidates = await optimizedDataService.getCandidates();
          const matchingCandidates = candidates.filter(c => 
            `${c.firstName} ${c.lastName}`.toLowerCase().includes(entity.value.toLowerCase()) ||
            c.firstName.toLowerCase().includes(entity.value.toLowerCase()) ||
            c.lastName.toLowerCase().includes(entity.value.toLowerCase())
          );
          
          // Add matching candidates
          for (const candidate of matchingCandidates) {
            if (!result.candidates!.some(c => c.id === candidate.id)) {
              result.candidates!.push(candidate);
              
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
        }
      } catch (error) {
        console.error(`Error retrieving candidate data:`, error);
      }
    });
    
    // Wait for all candidate promises to resolve
    await Promise.all(candidatePromises);
  }
  
  /**
   * Retrieve job-related data (optimized)
   * @param entities Job entities
   * @param result Data result to populate
   */
  private async retrieveJobData(entities: DetectedEntity[], result: RetrievedData): Promise<void> {
    // Initialize arrays if needed
    result.jobs = result.jobs || [];
    
    // Create a batch of promises for each entity
    const jobPromises = entities.map(async (entity) => {
      try {
        if (entity.id) {
          // Get job by ID using optimized service
          const job = await optimizedDataService.getJobById(entity.id);
          
          if (job && !result.jobs!.some(j => j.id === job.id)) {
            result.jobs!.push(job);
          }
        } else {
          // Try to find by title - get all jobs and filter
          const jobs = await optimizedDataService.getJobs();
          const matchingJobs = jobs.filter(j => 
            j.title.toLowerCase().includes(entity.value.toLowerCase())
          );
          
          // Add matching jobs
          for (const job of matchingJobs) {
            if (!result.jobs!.some(j => j.id === job.id)) {
              result.jobs!.push(job);
            }
          }
        }
      } catch (error) {
        console.error(`Error retrieving job data:`, error);
      }
    });
    
    // Wait for all job promises to resolve
    await Promise.all(jobPromises);
  }
  
  /**
   * Retrieve department-related data (optimized)
   * @param entities Department entities
   * @param result Data result to populate
   */
  private async retrieveDepartmentData(entities: DetectedEntity[], result: RetrievedData): Promise<void> {
    // Initialize arrays if needed
    result.employees = result.employees || [];
    
    // Create a batch of promises for each entity
    const departmentPromises = entities.map(async (entity) => {
      try {
        // Get employees in department using optimized service
        const employees = await optimizedDataService.getEmployeesByDepartment(entity.value);
        
        // Add matching employees
        for (const employee of employees) {
          if (!result.employees!.some(e => e.id === employee.id)) {
            result.employees!.push(employee);
          }
        }
      } catch (error) {
        console.error(`Error retrieving department data:`, error);
      }
    });
    
    // Wait for all department promises to resolve
    await Promise.all(departmentPromises);
  }
  
  /**
   * Retrieve date-related data (optimized)
   * @param entities Date entities
   * @param result Data result to populate
   */
  private async retrieveDateRelatedData(entities: DetectedEntity[], result: RetrievedData): Promise<void> {
    // Initialize arrays if needed
    result.shifts = result.shifts || [];
    
    // Create a batch of promises for each entity
    const datePromises = entities.map(async (entity) => {
      try {
        if (entity.type === EntityType.DATE) {
          // For exact dates, get shifts on that date
          const shifts = await optimizedDataService.getShiftsByDateRange(entity.value, entity.value);
          
          // Add matching shifts
          for (const shift of shifts) {
            if (!result.shifts!.some(s => s.id === shift.id)) {
              result.shifts!.push(shift);
            }
          }
        } else if (entity.type === EntityType.TIME_PERIOD) {
          // For time periods with explicit dates
          if (entity.metadata?.startDate && entity.metadata?.endDate) {
            const shifts = await optimizedDataService.getShiftsByDateRange(
              entity.metadata.startDate, 
              entity.metadata.endDate
            );
            
            // Add matching shifts
            for (const shift of shifts) {
              if (!result.shifts!.some(s => s.id === shift.id)) {
                result.shifts!.push(shift);
              }
            }
          } else {
            // For relative time periods (this week, next month, etc.)
            // Get current date range based on the value
            const dateRange = this.getDateRangeForTimePeriod(entity.value);
            
            if (dateRange) {
              const shifts = await optimizedDataService.getShiftsByDateRange(
                dateRange.startDate, 
                dateRange.endDate
              );
              
              // Add matching shifts
              for (const shift of shifts) {
                if (!result.shifts!.some(s => s.id === shift.id)) {
                  result.shifts!.push(shift);
                }
              }
            }
          }
        }
      } catch (error) {
        console.error(`Error retrieving date-related data:`, error);
      }
    });
    
    // Wait for all date promises to resolve
    await Promise.all(datePromises);
  }
  
  /**
   * Calculate date range for a time period value (same as original service)
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
   * Process intents to retrieve additional context data (optimized)
   */
  private async processIntents(
    primaryIntent: any, 
    secondaryIntents: any[], 
    result: RetrievedData
  ): Promise<void> {
    // Create promise arrays for different data types
    const promises: Promise<void>[] = [];
    
    // If employee is already fetched, get related employee data
    if (result.employees && result.employees.length > 0) {
      promises.push(this.retrieveEmployeeRelatedData(result.employees, primaryIntent, result));
    }
    
    // If candidate is already fetched, get related candidate data
    if (result.candidates && result.candidates.length > 0) {
      promises.push(this.retrieveCandidateRelatedData(result.candidates, primaryIntent, result));
    }
    
    // If job is already fetched, get related job data
    if (result.jobs && result.jobs.length > 0) {
      promises.push(this.retrieveJobRelatedData(result.jobs, primaryIntent, result));
    }
    
    // If no specific entities were found, get contextual data based on intent
    if (!result.employees?.length && !result.candidates?.length && !result.jobs?.length) {
      promises.push(this.retrieveContextualData(primaryIntent, secondaryIntents, result));
    }
    
    // Wait for all promises to resolve
    await Promise.all(promises);
  }
  
  /**
   * Retrieve additional data related to employees (optimized)
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
    
    // Create promise batches for different data types
    const shiftPromises: Promise<void>[] = [];
    const taskPromises: Promise<void>[] = [];
    const recognitionPromises: Promise<void>[] = [];
    
    // Process each employee
    for (const employee of employees) {
      // Get shifts based on intent category
      if (
        primaryIntent.category === IntentCategory.SCHEDULE_MANAGEMENT ||
        primaryIntent.subIntents?.includes('view_schedule')
      ) {
        shiftPromises.push((async () => {
          try {
            const shifts = await optimizedDataService.getShiftsByEmployeeId(employee.id);
            
            // Add matching shifts
            for (const shift of shifts) {
              if (!result.shifts!.some(s => s.id === shift.id)) {
                result.shifts!.push(shift);
              }
            }
          } catch (error) {
            console.error(`Error retrieving shifts for employee ${employee.id}:`, error);
          }
        })());
      }
      
      // Get tasks based on intent category
      if (
        primaryIntent.category === IntentCategory.TASK_MANAGEMENT ||
        primaryIntent.subIntents?.includes('view_tasks')
      ) {
        taskPromises.push((async () => {
          try {
            const tasks = await optimizedDataService.getEmployeeTasksByEmployeeId(employee.id);
            
            // Add matching tasks
            for (const task of tasks) {
              if (!result.employeeTasks!.some(t => t.id === task.id)) {
                result.employeeTasks!.push(task);
              }
            }
          } catch (error) {
            console.error(`Error retrieving tasks for employee ${employee.id}:`, error);
          }
        })());
      }
      
      // Get recognition based on intent category
      if (
        primaryIntent.category === IntentCategory.RECOGNITION ||
        primaryIntent.subIntents?.includes('view_recognitions')
      ) {
        recognitionPromises.push((async () => {
          try {
            const recognitions = await optimizedDataService.getRecognitionsByEmployeeId(employee.id);
            
            // Add matching recognitions
            for (const recognition of recognitions) {
              if (!result.recognition!.some(r => r.id === recognition.id)) {
                result.recognition!.push(recognition);
              }
            }
          } catch (error) {
            console.error(`Error retrieving recognitions for employee ${employee.id}:`, error);
          }
        })());
      }
    }
    
    // Wait for all promises to complete
    await Promise.all([
      Promise.all(shiftPromises),
      Promise.all(taskPromises),
      Promise.all(recognitionPromises)
    ]);
  }
  
  /**
   * Retrieve additional data related to candidates (optimized)
   */
  private async retrieveCandidateRelatedData(
    candidates: any[], 
    primaryIntent: any, 
    result: RetrievedData
  ): Promise<void> {
    // Initialize arrays if needed
    result.jobs = result.jobs || [];
    
    // Create promises to get related jobs for all candidates
    const promises = candidates.map(async (candidate) => {
      if (candidate.jobId) {
        try {
          const job = await optimizedDataService.getJobById(candidate.jobId);
          if (job && !result.jobs!.some(j => j.id === job.id)) {
            result.jobs!.push(job);
          }
        } catch (error) {
          console.error(`Error retrieving job for candidate ${candidate.id}:`, error);
        }
      }
    });
    
    // Wait for all job retrieval promises to complete
    await Promise.all(promises);
  }
  
  /**
   * Retrieve additional data related to jobs (optimized)
   */
  private async retrieveJobRelatedData(
    jobs: any[], 
    primaryIntent: any, 
    result: RetrievedData
  ): Promise<void> {
    // Initialize arrays if needed
    result.candidates = result.candidates || [];
    
    // Create promises to get candidates for all jobs
    const promises = jobs.map(async (job) => {
      if (
        primaryIntent.category === IntentCategory.CANDIDATE_MANAGEMENT ||
        primaryIntent.category === IntentCategory.INTERVIEW_PROCESS ||
        primaryIntent.category === IntentCategory.HIRING_WORKFLOW ||
        primaryIntent.subIntents?.includes('view_candidates')
      ) {
        try {
          const candidates = await optimizedDataService.getCandidatesByJobId(job.id);
          
          // Add matching candidates
          for (const candidate of candidates) {
            if (!result.candidates!.some(c => c.id === candidate.id)) {
              result.candidates!.push(candidate);
            }
          }
        } catch (error) {
          console.error(`Error retrieving candidates for job ${job.id}:`, error);
        }
      }
    });
    
    // Wait for all candidate retrieval promises to complete
    await Promise.all(promises);
  }
  
  /**
   * Retrieve contextual data based on intent when no specific entities are found (optimized)
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
   * Retrieve recent or upcoming shifts (optimized)
   */
  private async retrieveRecentShifts(result: RetrievedData): Promise<void> {
    try {
      // Get today's date
      const today = new Date().toISOString().split('T')[0];
      
      // Get end date (7 days from now)
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 7);
      const endDateStr = endDate.toISOString().split('T')[0];
      
      // Get shifts for the next week using optimized service
      const shifts = await optimizedDataService.getShiftsByDateRange(today, endDateStr);
      
      // Initialize shifts array if needed
      result.shifts = result.shifts || [];
      
      // Add shifts (limit to 10 for context window efficiency)
      result.shifts = [...shifts.slice(0, 10)];
    } catch (error) {
      console.error('Error retrieving recent shifts:', error);
    }
  }
  
  /**
   * Retrieve recent or pending tasks (optimized)
   */
  private async retrieveRecentTasks(result: RetrievedData): Promise<void> {
    try {
      // Get pending and in-progress tasks in parallel
      const [pendingTasks, inProgressTasks] = await Promise.all([
        optimizedDataService.getEmployeeTasksByStatus('pending'),
        optimizedDataService.getEmployeeTasksByStatus('in_progress')
      ]);
      
      // Initialize tasks array if needed
      result.employeeTasks = result.employeeTasks || [];
      
      // Add tasks (limit to 10 for context window efficiency)
      result.employeeTasks = [...pendingTasks, ...inProgressTasks].slice(0, 10);
    } catch (error) {
      console.error('Error retrieving recent tasks:', error);
    }
  }
  
  /**
   * Retrieve open jobs (optimized)
   */
  private async retrieveOpenJobs(result: RetrievedData): Promise<void> {
    try {
      // Get open jobs using optimized service
      const jobs = await optimizedDataService.getJobsByStatus('open');
      
      // Initialize jobs array if needed
      result.jobs = result.jobs || [];
      
      // Add jobs (limit to 10 for context window efficiency)
      result.jobs = [...jobs.slice(0, 10)];
    } catch (error) {
      console.error('Error retrieving open jobs:', error);
    }
  }
  
  /**
   * Retrieve active candidates (optimized)
   */
  private async retrieveActiveCandidates(result: RetrievedData): Promise<void> {
    try {
      // Get active candidates in parallel
      const [interviewCandidates, offerCandidates] = await Promise.all([
        optimizedDataService.getCandidatesByStage('interview'),
        optimizedDataService.getCandidatesByStage('offer')
      ]);
      
      // Initialize candidates array if needed
      result.candidates = result.candidates || [];
      
      // Add candidates (limit to 10 for context window efficiency)
      result.candidates = [...interviewCandidates, ...offerCandidates].slice(0, 10);
      
      // If candidates are found, also get their jobs
      if (result.candidates.length > 0) {
        // Get unique job IDs
        const jobIds = [...new Set(result.candidates.map(c => c.jobId))];
        
        // Initialize jobs array if needed
        result.jobs = result.jobs || [];
        
        // Create promises to get all jobs
        const jobPromises = jobIds.map(async (jobId) => {
          try {
            const job = await optimizedDataService.getJobById(jobId);
            if (job && !result.jobs!.some(j => j.id === job.id)) {
              result.jobs!.push(job);
            }
          } catch (error) {
            console.error(`Error retrieving job ${jobId}:`, error);
          }
        });
        
        // Wait for all job retrievals to complete
        await Promise.all(jobPromises);
      }
    } catch (error) {
      console.error('Error retrieving active candidates:', error);
    }
  }
  
  /**
   * Retrieve upcoming interviews (optimized)
   */
  private async retrieveUpcomingInterviews(result: RetrievedData): Promise<void> {
    try {
      // For now, we'll use candidates in the interview stage as a proxy
      const interviewCandidates = await optimizedDataService.getCandidatesByStage('interview');
      
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
        
        // Create promises to get all jobs
        const jobPromises = jobIds.map(async (jobId) => {
          try {
            const job = await optimizedDataService.getJobById(jobId);
            if (job && !result.jobs!.some(j => j.id === job.id)) {
              result.jobs!.push(job);
            }
          } catch (error) {
            console.error(`Error retrieving job ${jobId}:`, error);
          }
        });
        
        // Wait for all job retrievals to complete
        await Promise.all(jobPromises);
      }
    } catch (error) {
      console.error('Error retrieving upcoming interviews:', error);
    }
  }
  
  /**
   * Resolve relationships between retrieved data items (optimized)
   */
  private resolveRelationships(result: RetrievedData): void {
    // Initialize the related object if not present
    result.related = result.related || {};
    
    // Resolve employee-manager relationships
    if (result.employees && result.employees.length > 0) {
      // Create a map of employee IDs to employees for fast lookup
      const employeeMap = new Map();
      result.employees.forEach(emp => employeeMap.set(emp.id, emp));
      
      // Find managers and direct reports
      result.employees.forEach(employee => {
        // Set manager relationship
        if (employee.manager && employeeMap.has(employee.manager)) {
          // Add manager to related data
          result.related!.managers = result.related!.managers || {};
          result.related!.managers[employee.id] = employeeMap.get(employee.manager);
        }
        
        // Set direct reports relationship
        const directReports = result.employees!.filter(emp => emp.manager === employee.id);
        if (directReports.length > 0) {
          // Add direct reports to related data
          result.related!.directReports = result.related!.directReports || {};
          result.related!.directReports[employee.id] = directReports;
        }
      });
    }
    
    // Resolve employee-shift relationships in a single pass
    if (result.employees && result.shifts && result.shifts.length > 0) {
      result.related!.employeeShifts = {};
      
      // Group shifts by employee ID
      result.shifts.forEach(shift => {
        const employeeId = shift.employeeId;
        result.related!.employeeShifts[employeeId] = result.related!.employeeShifts[employeeId] || [];
        result.related!.employeeShifts[employeeId].push(shift);
      });
    }
    
    // Resolve employee-task relationships in a single pass
    if (result.employees && result.employeeTasks && result.employeeTasks.length > 0) {
      result.related!.employeeTasks = {};
      
      // Group tasks by employee ID
      result.employeeTasks.forEach(task => {
        const employeeId = task.employeeId;
        result.related!.employeeTasks[employeeId] = result.related!.employeeTasks[employeeId] || [];
        result.related!.employeeTasks[employeeId].push(task);
      });
    }
    
    // Resolve job-candidate relationships in a single pass
    if (result.jobs && result.candidates && result.candidates.length > 0) {
      result.related!.jobCandidates = {};
      
      // Group candidates by job ID
      result.candidates.forEach(candidate => {
        const jobId = candidate.jobId;
        result.related!.jobCandidates[jobId] = result.related!.jobCandidates[jobId] || [];
        result.related!.jobCandidates[jobId].push(candidate);
      });
    }
  }
  
  /**
   * Create a simple hash of the query for caching
   * @param query The query to hash
   * @returns A string hash of the query
   */
  private hashQuery(query: string): string {
    // Simple hashing function, could be replaced with more sophisticated hashing
    let hash = 0;
    for (let i = 0; i < query.length; i++) {
      const char = query.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString();
  }
  
  /**
   * Update performance metrics
   * @param startTime Start time of operation
   * @param cacheHit Whether the result was from cache
   */
  private updateMetrics(startTime: number, cacheHit: boolean): void {
    const processingTime = Date.now() - startTime;
    
    // Update metrics
    this.metrics.queriesProcessed++;
    this.metrics.lastUpdated = new Date();
    
    if (cacheHit) {
      this.metrics.cacheHits++;
    } else {
      this.metrics.cacheMisses++;
    }
    
    // Keep track of processing times (up to last 100)
    this.processingTimes.push(processingTime);
    if (this.processingTimes.length > 100) {
      this.processingTimes.shift();
    }
    
    // Calculate average processing time
    this.metrics.averageProcessingTime = 
      this.processingTimes.reduce((sum, time) => sum + time, 0) / this.processingTimes.length;
  }
  
  /**
   * Track entity types for metrics
   * @param entities Entities detected in query
   */
  private trackEntityTypes(entities: DetectedEntity[]): void {
    entities.forEach(entity => {
      this.metrics.entityCounts[entity.type] = (this.metrics.entityCounts[entity.type] || 0) + 1;
    });
  }
  
  /**
   * Track intent type for metrics
   * @param intentCategory Intent category
   */
  private trackIntentType(intentCategory: string): void {
    this.metrics.intentCounts[intentCategory] = (this.metrics.intentCounts[intentCategory] || 0) + 1;
  }
  
  /**
   * Get performance metrics
   * @returns Current metrics
   */
  getMetrics(): DataRetrievalMetrics {
    return {
      ...this.metrics,
      hitRate: this.metrics.queriesProcessed > 0 
        ? this.metrics.cacheHits / this.metrics.queriesProcessed 
        : 0
    };
  }
  
  /**
   * Clear the query cache
   */
  clearQueryCache(): void {
    cacheService.clearCategory('query');
    console.info('Query cache cleared');
  }
}

// Export a singleton instance
const optimizedDataRetrievalService = new OptimizedDataRetrievalService();
export default optimizedDataRetrievalService;