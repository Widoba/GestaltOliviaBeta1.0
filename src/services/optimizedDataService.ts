/**
 * Optimized Data Service with advanced caching and batched data fetching
 */
import { promises as fs } from 'fs';
import path from 'path';
import cacheService from './cacheService';
import dataService, {
  Employee, Employees,
  Shift, Shifts,
  EmployeeTask, EmployeeTasks,
  TalentTask, TalentTasks,
  RecognitionTask, RecognitionTasks,
  ShiftTask, ShiftTasks,
  Job, Jobs,
  Candidate, Candidates,
  Recognition, Recognitions
} from './dataService';

/**
 * Request batch for collecting similar data queries
 */
interface RequestBatch<T> {
  promise: Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: any) => void;
  timestamp: number;
}

/**
 * Performance metrics for monitoring
 */
interface PerformanceMetrics {
  cacheHits: number;
  cacheMisses: number;
  totalDataRequests: number;
  batchedRequests: number;
  averageResponseTime: number;
  responseTimes: number[];
  lastUpdated: Date;
}

/**
 * Optimized Data Service with caching and batched fetching
 */
class OptimizedDataService {
  // Batching queues for different data types
  private employeeBatchQueue: Map<string, RequestBatch<Employee | undefined>> = new Map();
  private jobBatchQueue: Map<string, RequestBatch<Job | undefined>> = new Map();
  private candidateBatchQueue: Map<string, RequestBatch<Candidate | undefined>> = new Map();
  
  // Tracking when the last batch was processed
  private lastBatchProcessTime: Record<string, number> = {
    employees: 0,
    jobs: 0,
    candidates: 0
  };
  
  // Batch processing interval in milliseconds
  private batchInterval = 50; // 50ms batching window
  
  // Performance metrics
  private metrics: PerformanceMetrics = {
    cacheHits: 0,
    cacheMisses: 0,
    totalDataRequests: 0,
    batchedRequests: 0,
    averageResponseTime: 0,
    responseTimes: [],
    lastUpdated: new Date()
  };
  
  constructor() {
    // Initialize batch processing
    this.initializeBatchProcessing();
    
    // Preload common data
    this.preloadCommonData();
  }
  
  /**
   * Initialize batch processing intervals
   */
  private initializeBatchProcessing(): void {
    // Process employee batches
    setInterval(() => this.processEmployeeBatch(), this.batchInterval);
    
    // Process job batches
    setInterval(() => this.processJobBatch(), this.batchInterval);
    
    // Process candidate batches
    setInterval(() => this.processCandidateBatch(), this.batchInterval);
  }
  
  /**
   * Preload frequently accessed data into cache
   */
  private async preloadCommonData(): Promise<void> {
    try {
      // Preload all employees
      const employees = await dataService.getEmployees();
      cacheService.set('all', employees, { 
        category: 'employees',
        ttl: 15 * 60 * 1000 // 15 minutes TTL for employees list
      });
      
      // Preload open jobs
      const jobs = await dataService.getJobs();
      const openJobs = jobs.filter(job => job.status === 'open');
      cacheService.set('open', openJobs, { 
        category: 'jobs',
        ttl: 30 * 60 * 1000 // 30 minutes TTL for open jobs
      });
      
      // Preload active candidates
      const candidates = await dataService.getCandidates();
      const activeCandidates = candidates.filter(candidate => 
        candidate.status === 'active' || 
        candidate.stage === 'interview' || 
        candidate.stage === 'offer'
      );
      cacheService.set('active', activeCandidates, { 
        category: 'candidates',
        ttl: 15 * 60 * 1000 // 15 minutes TTL for active candidates
      });
      
      console.info('Preloaded common data into cache');
    } catch (error) {
      console.error('Error preloading common data:', error);
    }
  }
  
  /**
   * Process batched employee requests
   */
  private async processEmployeeBatch(): Promise<void> {
    if (this.employeeBatchQueue.size === 0) return;
    
    const now = Date.now();
    if (now - this.lastBatchProcessTime.employees < this.batchInterval) return;
    
    this.lastBatchProcessTime.employees = now;
    
    // Get all employee IDs in the current batch
    const employeeIds = Array.from(this.employeeBatchQueue.keys());
    
    if (employeeIds.length === 0) return;
    
    try {
      // Record the number of batched requests
      this.metrics.batchedRequests += employeeIds.length - 1;
      
      // Load all employees at once (they might be cached)
      const allEmployees = await this.getEmployees();
      
      // Create a map for quick lookup
      const employeeMap = new Map<string, Employee>();
      allEmployees.forEach(employee => employeeMap.set(employee.id, employee));
      
      // Resolve each request in the batch
      for (const [id, batch] of this.employeeBatchQueue.entries()) {
        const employee = employeeMap.get(id);
        batch.resolve(employee);
      }
    } catch (error) {
      // If there's an error, reject all batched requests
      for (const batch of this.employeeBatchQueue.values()) {
        batch.reject(error);
      }
    } finally {
      // Clear the batch queue
      this.employeeBatchQueue.clear();
    }
  }
  
  /**
   * Process batched job requests
   */
  private async processJobBatch(): Promise<void> {
    if (this.jobBatchQueue.size === 0) return;
    
    const now = Date.now();
    if (now - this.lastBatchProcessTime.jobs < this.batchInterval) return;
    
    this.lastBatchProcessTime.jobs = now;
    
    // Get all job IDs in the current batch
    const jobIds = Array.from(this.jobBatchQueue.keys());
    
    if (jobIds.length === 0) return;
    
    try {
      // Record the number of batched requests
      this.metrics.batchedRequests += jobIds.length - 1;
      
      // Load all jobs at once (they might be cached)
      const allJobs = await this.getJobs();
      
      // Create a map for quick lookup
      const jobMap = new Map<string, Job>();
      allJobs.forEach(job => jobMap.set(job.id, job));
      
      // Resolve each request in the batch
      for (const [id, batch] of this.jobBatchQueue.entries()) {
        const job = jobMap.get(id);
        batch.resolve(job);
      }
    } catch (error) {
      // If there's an error, reject all batched requests
      for (const batch of this.jobBatchQueue.values()) {
        batch.reject(error);
      }
    } finally {
      // Clear the batch queue
      this.jobBatchQueue.clear();
    }
  }
  
  /**
   * Process batched candidate requests
   */
  private async processCandidateBatch(): Promise<void> {
    if (this.candidateBatchQueue.size === 0) return;
    
    const now = Date.now();
    if (now - this.lastBatchProcessTime.candidates < this.batchInterval) return;
    
    this.lastBatchProcessTime.candidates = now;
    
    // Get all candidate IDs in the current batch
    const candidateIds = Array.from(this.candidateBatchQueue.keys());
    
    if (candidateIds.length === 0) return;
    
    try {
      // Record the number of batched requests
      this.metrics.batchedRequests += candidateIds.length - 1;
      
      // Load all candidates at once (they might be cached)
      const allCandidates = await this.getCandidates();
      
      // Create a map for quick lookup
      const candidateMap = new Map<string, Candidate>();
      allCandidates.forEach(candidate => candidateMap.set(candidate.id, candidate));
      
      // Resolve each request in the batch
      for (const [id, batch] of this.candidateBatchQueue.entries()) {
        const candidate = candidateMap.get(id);
        batch.resolve(candidate);
      }
    } catch (error) {
      // If there's an error, reject all batched requests
      for (const batch of this.candidateBatchQueue.values()) {
        batch.reject(error);
      }
    } finally {
      // Clear the batch queue
      this.candidateBatchQueue.clear();
    }
  }
  
  /**
   * Track request performance
   * @param startTime Request start time
   * @param cacheHit Whether the request was served from cache
   */
  private trackPerformance(startTime: number, cacheHit: boolean): void {
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    // Update metrics
    this.metrics.totalDataRequests++;
    this.metrics.lastUpdated = new Date();
    
    if (cacheHit) {
      this.metrics.cacheHits++;
    } else {
      this.metrics.cacheMisses++;
    }
    
    // Keep last 100 response times
    this.metrics.responseTimes.push(responseTime);
    if (this.metrics.responseTimes.length > 100) {
      this.metrics.responseTimes.shift();
    }
    
    // Calculate average response time
    this.metrics.averageResponseTime = this.metrics.responseTimes.reduce((sum, time) => sum + time, 0) / 
      this.metrics.responseTimes.length;
  }
  
  /**
   * Get performance metrics
   * @returns Current performance metrics
   */
  getPerformanceMetrics(): PerformanceMetrics {
    return {
      ...this.metrics,
      cacheStats: cacheService.getStats()
    };
  }
  
  // ===== Cached Data Access Methods =====
  
  /**
   * Get all employees (cached)
   * @returns Promise resolving to employee array
   */
  async getEmployees(): Promise<Employee[]> {
    const startTime = Date.now();
    
    // Try to get from cache first
    const cachedEmployees = cacheService.get<Employee[]>('all', 'employees');
    if (cachedEmployees) {
      this.trackPerformance(startTime, true);
      return cachedEmployees;
    }
    
    // Not in cache, load from service
    try {
      const employees = await dataService.getEmployees();
      
      // Store in cache
      cacheService.set('all', employees, { category: 'employees' });
      
      this.trackPerformance(startTime, false);
      return employees;
    } catch (error) {
      console.error('Error fetching employees:', error);
      throw error;
    }
  }
  
  /**
   * Get employee by ID (cached and batched)
   * @param id Employee ID
   * @returns Promise resolving to employee or undefined
   */
  async getEmployeeById(id: string): Promise<Employee | undefined> {
    const startTime = Date.now();
    
    // Try to get from cache first
    const cachedEmployee = cacheService.get<Employee>(`employee_${id}`, 'employees');
    if (cachedEmployee) {
      this.trackPerformance(startTime, true);
      return cachedEmployee;
    }
    
    // Not in cache, check if we have pending batch request
    if (this.employeeBatchQueue.has(id)) {
      const batch = this.employeeBatchQueue.get(id)!;
      try {
        const employee = await batch.promise;
        if (employee) {
          cacheService.set(`employee_${id}`, employee, { category: 'employees' });
        }
        this.trackPerformance(startTime, false);
        return employee;
      } catch (error) {
        console.error(`Error in batched fetch for employee ${id}:`, error);
        throw error;
      }
    }
    
    // Create a new batch request
    return new Promise<Employee | undefined>((resolve, reject) => {
      const batch: RequestBatch<Employee | undefined> = {
        promise: new Promise<Employee | undefined>((res, rej) => {
          resolve = res;
          reject = rej;
        }),
        resolve,
        reject,
        timestamp: Date.now()
      };
      
      this.employeeBatchQueue.set(id, batch);
      
      // If this is the only request, process immediately
      if (this.employeeBatchQueue.size === 1) {
        setTimeout(() => this.processEmployeeBatch(), 0);
      }
    }).then(employee => {
      // Store in cache if found
      if (employee) {
        cacheService.set(`employee_${id}`, employee, { category: 'employees' });
      }
      this.trackPerformance(startTime, false);
      return employee;
    });
  }
  
  /**
   * Get employees by manager (cached)
   * @param managerId Manager ID
   * @returns Promise resolving to employee array
   */
  async getEmployeesByManager(managerId: string): Promise<Employee[]> {
    const startTime = Date.now();
    
    // Try to get from cache first
    const cacheKey = `manager_${managerId}`;
    const cachedEmployees = cacheService.get<Employee[]>(cacheKey, 'relationships');
    if (cachedEmployees) {
      this.trackPerformance(startTime, true);
      return cachedEmployees;
    }
    
    // Not in cache, fetch all employees and filter
    const allEmployees = await this.getEmployees();
    const directReports = allEmployees.filter(emp => emp.manager === managerId);
    
    // Store in cache
    cacheService.set(cacheKey, directReports, { 
      category: 'relationships',
      ttl: 30 * 60 * 1000 // 30 minutes TTL for relationships
    });
    
    this.trackPerformance(startTime, false);
    return directReports;
  }
  
  /**
   * Get employees by department (cached)
   * @param department Department name
   * @returns Promise resolving to employee array
   */
  async getEmployeesByDepartment(department: string): Promise<Employee[]> {
    const startTime = Date.now();
    
    // Try to get from cache first
    const cacheKey = `department_${department.toLowerCase()}`;
    const cachedEmployees = cacheService.get<Employee[]>(cacheKey, 'relationships');
    if (cachedEmployees) {
      this.trackPerformance(startTime, true);
      return cachedEmployees;
    }
    
    // Not in cache, fetch all employees and filter
    const allEmployees = await this.getEmployees();
    const departmentEmployees = allEmployees.filter(emp => 
      emp.department.toLowerCase() === department.toLowerCase()
    );
    
    // Store in cache
    cacheService.set(cacheKey, departmentEmployees, { 
      category: 'relationships',
      ttl: 30 * 60 * 1000 // 30 minutes TTL for relationships
    });
    
    this.trackPerformance(startTime, false);
    return departmentEmployees;
  }
  
  /**
   * Get all shifts (cached)
   * @returns Promise resolving to shift array
   */
  async getShifts(): Promise<Shift[]> {
    const startTime = Date.now();
    
    // Try to get from cache first
    const cachedShifts = cacheService.get<Shift[]>('all', 'shifts');
    if (cachedShifts) {
      this.trackPerformance(startTime, true);
      return cachedShifts;
    }
    
    // Not in cache, load from service
    try {
      const shifts = await dataService.getShifts();
      
      // Store in cache
      cacheService.set('all', shifts, { category: 'shifts' });
      
      this.trackPerformance(startTime, false);
      return shifts;
    } catch (error) {
      console.error('Error fetching shifts:', error);
      throw error;
    }
  }
  
  /**
   * Get shifts by employee ID (cached)
   * @param employeeId Employee ID
   * @returns Promise resolving to shift array
   */
  async getShiftsByEmployeeId(employeeId: string): Promise<Shift[]> {
    const startTime = Date.now();
    
    // Try to get from cache first
    const cacheKey = `employee_${employeeId}`;
    const cachedShifts = cacheService.get<Shift[]>(cacheKey, 'shifts');
    if (cachedShifts) {
      this.trackPerformance(startTime, true);
      return cachedShifts;
    }
    
    // Not in cache, fetch from service
    try {
      const shifts = await dataService.getShiftsByEmployeeId(employeeId);
      
      // Store in cache
      cacheService.set(cacheKey, shifts, { category: 'shifts' });
      
      this.trackPerformance(startTime, false);
      return shifts;
    } catch (error) {
      console.error(`Error fetching shifts for employee ${employeeId}:`, error);
      throw error;
    }
  }
  
  /**
   * Get shifts by date range (cached)
   * @param startDate Start date
   * @param endDate End date
   * @returns Promise resolving to shift array
   */
  async getShiftsByDateRange(startDate: string, endDate: string): Promise<Shift[]> {
    const startTime = Date.now();
    
    // Try to get from cache first
    const cacheKey = `date_${startDate}_${endDate}`;
    const cachedShifts = cacheService.get<Shift[]>(cacheKey, 'shifts');
    if (cachedShifts) {
      this.trackPerformance(startTime, true);
      return cachedShifts;
    }
    
    // Not in cache, fetch from service
    try {
      const shifts = await dataService.getShiftsByDateRange(startDate, endDate);
      
      // Store in cache with shorter TTL (date-based data changes more often)
      cacheService.set(cacheKey, shifts, { 
        category: 'shifts',
        ttl: 5 * 60 * 1000 // 5 minutes TTL for date-based queries
      });
      
      this.trackPerformance(startTime, false);
      return shifts;
    } catch (error) {
      console.error(`Error fetching shifts for date range ${startDate} to ${endDate}:`, error);
      throw error;
    }
  }
  
  /**
   * Get all employee tasks (cached)
   * @returns Promise resolving to task array
   */
  async getEmployeeTasks(): Promise<EmployeeTask[]> {
    const startTime = Date.now();
    
    // Try to get from cache first
    const cachedTasks = cacheService.get<EmployeeTask[]>('all', 'tasks');
    if (cachedTasks) {
      this.trackPerformance(startTime, true);
      return cachedTasks;
    }
    
    // Not in cache, load from service
    try {
      const tasks = await dataService.getEmployeeTasks();
      
      // Store in cache (shorter TTL for tasks as they change frequently)
      cacheService.set('all', tasks, { 
        category: 'tasks',
        ttl: 5 * 60 * 1000 // 5 minutes TTL for tasks
      });
      
      this.trackPerformance(startTime, false);
      return tasks;
    } catch (error) {
      console.error('Error fetching employee tasks:', error);
      throw error;
    }
  }
  
  /**
   * Get tasks by employee ID (cached)
   * @param employeeId Employee ID
   * @returns Promise resolving to task array
   */
  async getEmployeeTasksByEmployeeId(employeeId: string): Promise<EmployeeTask[]> {
    const startTime = Date.now();
    
    // Try to get from cache first
    const cacheKey = `employee_${employeeId}`;
    const cachedTasks = cacheService.get<EmployeeTask[]>(cacheKey, 'tasks');
    if (cachedTasks) {
      this.trackPerformance(startTime, true);
      return cachedTasks;
    }
    
    // Not in cache, fetch from service
    try {
      const tasks = await dataService.getEmployeeTasksByEmployeeId(employeeId);
      
      // Store in cache with shorter TTL (tasks change frequently)
      cacheService.set(cacheKey, tasks, { 
        category: 'tasks',
        ttl: 5 * 60 * 1000 // 5 minutes TTL for employee tasks
      });
      
      this.trackPerformance(startTime, false);
      return tasks;
    } catch (error) {
      console.error(`Error fetching tasks for employee ${employeeId}:`, error);
      throw error;
    }
  }
  
  /**
   * Get tasks by status (cached)
   * @param status Task status
   * @returns Promise resolving to task array
   */
  async getEmployeeTasksByStatus(status: string): Promise<EmployeeTask[]> {
    const startTime = Date.now();
    
    // Try to get from cache first
    const cacheKey = `status_${status}`;
    const cachedTasks = cacheService.get<EmployeeTask[]>(cacheKey, 'tasks');
    if (cachedTasks) {
      this.trackPerformance(startTime, true);
      return cachedTasks;
    }
    
    // Not in cache, fetch all tasks and filter
    const allTasks = await this.getEmployeeTasks();
    const filteredTasks = allTasks.filter(task => task.status === status);
    
    // Store in cache with shorter TTL
    cacheService.set(cacheKey, filteredTasks, { 
      category: 'tasks',
      ttl: 5 * 60 * 1000 // 5 minutes TTL for status filtered tasks
    });
    
    this.trackPerformance(startTime, false);
    return filteredTasks;
  }
  
  /**
   * Get all jobs (cached)
   * @returns Promise resolving to job array
   */
  async getJobs(): Promise<Job[]> {
    const startTime = Date.now();
    
    // Try to get from cache first
    const cachedJobs = cacheService.get<Job[]>('all', 'jobs');
    if (cachedJobs) {
      this.trackPerformance(startTime, true);
      return cachedJobs;
    }
    
    // Not in cache, load from service
    try {
      const jobs = await dataService.getJobs();
      
      // Store in cache
      cacheService.set('all', jobs, { category: 'jobs' });
      
      this.trackPerformance(startTime, false);
      return jobs;
    } catch (error) {
      console.error('Error fetching jobs:', error);
      throw error;
    }
  }
  
  /**
   * Get job by ID (cached and batched)
   * @param id Job ID
   * @returns Promise resolving to job or undefined
   */
  async getJobById(id: string): Promise<Job | undefined> {
    const startTime = Date.now();
    
    // Try to get from cache first
    const cachedJob = cacheService.get<Job>(`job_${id}`, 'jobs');
    if (cachedJob) {
      this.trackPerformance(startTime, true);
      return cachedJob;
    }
    
    // Not in cache, check if we have pending batch request
    if (this.jobBatchQueue.has(id)) {
      const batch = this.jobBatchQueue.get(id)!;
      try {
        const job = await batch.promise;
        if (job) {
          cacheService.set(`job_${id}`, job, { category: 'jobs' });
        }
        this.trackPerformance(startTime, false);
        return job;
      } catch (error) {
        console.error(`Error in batched fetch for job ${id}:`, error);
        throw error;
      }
    }
    
    // Create a new batch request
    return new Promise<Job | undefined>((resolve, reject) => {
      const batch: RequestBatch<Job | undefined> = {
        promise: new Promise<Job | undefined>((res, rej) => {
          resolve = res;
          reject = rej;
        }),
        resolve,
        reject,
        timestamp: Date.now()
      };
      
      this.jobBatchQueue.set(id, batch);
      
      // If this is the only request, process immediately
      if (this.jobBatchQueue.size === 1) {
        setTimeout(() => this.processJobBatch(), 0);
      }
    }).then(job => {
      // Store in cache if found
      if (job) {
        cacheService.set(`job_${id}`, job, { category: 'jobs' });
      }
      this.trackPerformance(startTime, false);
      return job;
    });
  }
  
  /**
   * Get jobs by status (cached)
   * @param status Job status
   * @returns Promise resolving to job array
   */
  async getJobsByStatus(status: string): Promise<Job[]> {
    const startTime = Date.now();
    
    // Try to get from cache first
    const cacheKey = `status_${status}`;
    const cachedJobs = cacheService.get<Job[]>(cacheKey, 'jobs');
    if (cachedJobs) {
      this.trackPerformance(startTime, true);
      return cachedJobs;
    }
    
    // Not in cache, fetch all jobs and filter
    const allJobs = await this.getJobs();
    const filteredJobs = allJobs.filter(job => job.status === status);
    
    // Store in cache
    cacheService.set(cacheKey, filteredJobs, { category: 'jobs' });
    
    this.trackPerformance(startTime, false);
    return filteredJobs;
  }
  
  /**
   * Get jobs by hiring manager (cached)
   * @param managerId Manager ID
   * @returns Promise resolving to job array
   */
  async getJobsByHiringManager(managerId: string): Promise<Job[]> {
    const startTime = Date.now();
    
    // Try to get from cache first
    const cacheKey = `manager_${managerId}`;
    const cachedJobs = cacheService.get<Job[]>(cacheKey, 'jobs');
    if (cachedJobs) {
      this.trackPerformance(startTime, true);
      return cachedJobs;
    }
    
    // Not in cache, fetch all jobs and filter
    const allJobs = await this.getJobs();
    const filteredJobs = allJobs.filter(job => job.hiringManager === managerId);
    
    // Store in cache
    cacheService.set(cacheKey, filteredJobs, { category: 'jobs' });
    
    this.trackPerformance(startTime, false);
    return filteredJobs;
  }
  
  /**
   * Get all candidates (cached)
   * @returns Promise resolving to candidate array
   */
  async getCandidates(): Promise<Candidate[]> {
    const startTime = Date.now();
    
    // Try to get from cache first
    const cachedCandidates = cacheService.get<Candidate[]>('all', 'candidates');
    if (cachedCandidates) {
      this.trackPerformance(startTime, true);
      return cachedCandidates;
    }
    
    // Not in cache, load from service
    try {
      const candidates = await dataService.getCandidates();
      
      // Store in cache
      cacheService.set('all', candidates, { category: 'candidates' });
      
      this.trackPerformance(startTime, false);
      return candidates;
    } catch (error) {
      console.error('Error fetching candidates:', error);
      throw error;
    }
  }
  
  /**
   * Get candidate by ID (cached and batched)
   * @param id Candidate ID
   * @returns Promise resolving to candidate or undefined
   */
  async getCandidateById(id: string): Promise<Candidate | undefined> {
    const startTime = Date.now();
    
    // Try to get from cache first
    const cachedCandidate = cacheService.get<Candidate>(`candidate_${id}`, 'candidates');
    if (cachedCandidate) {
      this.trackPerformance(startTime, true);
      return cachedCandidate;
    }
    
    // Not in cache, check if we have pending batch request
    if (this.candidateBatchQueue.has(id)) {
      const batch = this.candidateBatchQueue.get(id)!;
      try {
        const candidate = await batch.promise;
        if (candidate) {
          cacheService.set(`candidate_${id}`, candidate, { category: 'candidates' });
        }
        this.trackPerformance(startTime, false);
        return candidate;
      } catch (error) {
        console.error(`Error in batched fetch for candidate ${id}:`, error);
        throw error;
      }
    }
    
    // Create a new batch request
    return new Promise<Candidate | undefined>((resolve, reject) => {
      const batch: RequestBatch<Candidate | undefined> = {
        promise: new Promise<Candidate | undefined>((res, rej) => {
          resolve = res;
          reject = rej;
        }),
        resolve,
        reject,
        timestamp: Date.now()
      };
      
      this.candidateBatchQueue.set(id, batch);
      
      // If this is the only request, process immediately
      if (this.candidateBatchQueue.size === 1) {
        setTimeout(() => this.processCandidateBatch(), 0);
      }
    }).then(candidate => {
      // Store in cache if found
      if (candidate) {
        cacheService.set(`candidate_${id}`, candidate, { category: 'candidates' });
      }
      this.trackPerformance(startTime, false);
      return candidate;
    });
  }
  
  /**
   * Get candidates by job ID (cached)
   * @param jobId Job ID
   * @returns Promise resolving to candidate array
   */
  async getCandidatesByJobId(jobId: string): Promise<Candidate[]> {
    const startTime = Date.now();
    
    // Try to get from cache first
    const cacheKey = `job_${jobId}`;
    const cachedCandidates = cacheService.get<Candidate[]>(cacheKey, 'candidates');
    if (cachedCandidates) {
      this.trackPerformance(startTime, true);
      return cachedCandidates;
    }
    
    // Not in cache, fetch all candidates and filter
    const allCandidates = await this.getCandidates();
    const filteredCandidates = allCandidates.filter(candidate => candidate.jobId === jobId);
    
    // Store in cache
    cacheService.set(cacheKey, filteredCandidates, { category: 'candidates' });
    
    this.trackPerformance(startTime, false);
    return filteredCandidates;
  }
  
  /**
   * Get candidates by stage (cached)
   * @param stage Candidate stage
   * @returns Promise resolving to candidate array
   */
  async getCandidatesByStage(stage: string): Promise<Candidate[]> {
    const startTime = Date.now();
    
    // Try to get from cache first
    const cacheKey = `stage_${stage}`;
    const cachedCandidates = cacheService.get<Candidate[]>(cacheKey, 'candidates');
    if (cachedCandidates) {
      this.trackPerformance(startTime, true);
      return cachedCandidates;
    }
    
    // Not in cache, fetch all candidates and filter
    const allCandidates = await this.getCandidates();
    const filteredCandidates = allCandidates.filter(candidate => candidate.stage === stage);
    
    // Store in cache
    cacheService.set(cacheKey, filteredCandidates, { category: 'candidates' });
    
    this.trackPerformance(startTime, false);
    return filteredCandidates;
  }
  
  /**
   * Get all recognitions (cached)
   * @returns Promise resolving to recognition array
   */
  async getRecognitions(): Promise<Recognition[]> {
    const startTime = Date.now();
    
    // Try to get from cache first
    const cachedRecognitions = cacheService.get<Recognition[]>('all', 'recognition');
    if (cachedRecognitions) {
      this.trackPerformance(startTime, true);
      return cachedRecognitions;
    }
    
    // Not in cache, load from service
    try {
      const recognitions = await dataService.getRecognitions();
      
      // Store in cache
      cacheService.set('all', recognitions, { category: 'recognition' });
      
      this.trackPerformance(startTime, false);
      return recognitions;
    } catch (error) {
      console.error('Error fetching recognitions:', error);
      throw error;
    }
  }
  
  /**
   * Get recognitions by employee ID (cached)
   * @param employeeId Employee ID
   * @returns Promise resolving to recognition array
   */
  async getRecognitionsByEmployeeId(employeeId: string): Promise<Recognition[]> {
    const startTime = Date.now();
    
    // Try to get from cache first
    const cacheKey = `employee_${employeeId}`;
    const cachedRecognitions = cacheService.get<Recognition[]>(cacheKey, 'recognition');
    if (cachedRecognitions) {
      this.trackPerformance(startTime, true);
      return cachedRecognitions;
    }
    
    // Not in cache, fetch from service
    try {
      const recognitions = await dataService.getRecognitionsByEmployeeId(employeeId);
      
      // Store in cache
      cacheService.set(cacheKey, recognitions, { category: 'recognition' });
      
      this.trackPerformance(startTime, false);
      return recognitions;
    } catch (error) {
      console.error(`Error fetching recognitions for employee ${employeeId}:`, error);
      throw error;
    }
  }
  
  // ===== Composite Data Methods =====
  
  /**
   * Get dashboard data for a manager (cached and optimized)
   * @param managerId Manager ID
   * @returns Promise resolving to dashboard data
   */
  async getManagerDashboardData(managerId: string) {
    const startTime = Date.now();
    
    // Try to get from cache first
    const cacheKey = `dashboard_${managerId}`;
    const cachedData = cacheService.get(cacheKey, 'query');
    if (cachedData) {
      this.trackPerformance(startTime, true);
      return cachedData;
    }
    
    // Not in cache, fetch data in parallel for performance
    try {
      const [
        employees,
        talentTasks,
        recognitionTasks,
        shiftTasks,
        jobs
      ] = await Promise.all([
        this.getEmployeesByManager(managerId),
        this.getTalentTasksByManagerId(managerId),
        this.getRecognitionTasksByManagerId(managerId),
        this.getShiftTasksByManagerId(managerId),
        this.getJobsByHiringManager(managerId)
      ]);
      
      // Get candidates for manager's job postings in parallel
      const jobIds = jobs.map(job => job.id);
      const allCandidates = await this.getCandidates();
      const candidates = allCandidates.filter(candidate => 
        jobIds.includes(candidate.jobId)
      );
      
      const dashboardData = {
        employees,
        talentTasks,
        recognitionTasks,
        shiftTasks,
        jobs,
        candidates
      };
      
      // Store in cache with shorter TTL
      cacheService.set(cacheKey, dashboardData, { 
        category: 'query',
        ttl: 5 * 60 * 1000 // 5 minutes TTL for dashboard data
      });
      
      this.trackPerformance(startTime, false);
      return dashboardData;
    } catch (error) {
      console.error(`Error fetching dashboard data for manager ${managerId}:`, error);
      throw error;
    }
  }
  
  /**
   * Get employee profile with related data (cached and optimized)
   * @param employeeId Employee ID
   * @returns Promise resolving to employee profile
   */
  async getEmployeeProfile(employeeId: string) {
    const startTime = Date.now();
    
    // Try to get from cache first
    const cacheKey = `profile_${employeeId}`;
    const cachedProfile = cacheService.get(cacheKey, 'query');
    if (cachedProfile) {
      this.trackPerformance(startTime, true);
      return cachedProfile;
    }
    
    // Not in cache, fetch employee first
    const employee = await this.getEmployeeById(employeeId);
    if (!employee) return null;
    
    // Fetch related data in parallel
    try {
      const [
        tasks,
        shifts,
        recognitions
      ] = await Promise.all([
        this.getEmployeeTasksByEmployeeId(employeeId),
        this.getShiftsByEmployeeId(employeeId),
        this.getRecognitionsByEmployeeId(employeeId)
      ]);
      
      // Fetch manager and direct reports conditionally
      let manager = null;
      let directReports = [];
      
      if (employee.manager) {
        manager = await this.getEmployeeById(employee.manager);
      }
      
      if (employee.position.includes('Manager') || employee.position.includes('Director')) {
        directReports = await this.getEmployeesByManager(employeeId);
      }
      
      const profileData = {
        employee,
        manager,
        directReports,
        tasks,
        shifts,
        recognitions
      };
      
      // Store in cache with shorter TTL
      cacheService.set(cacheKey, profileData, { 
        category: 'query',
        ttl: 5 * 60 * 1000 // 5 minutes TTL for profile data
      });
      
      this.trackPerformance(startTime, false);
      return profileData;
    } catch (error) {
      console.error(`Error fetching profile for employee ${employeeId}:`, error);
      throw error;
    }
  }
  
  /**
   * Get job posting details with related data (cached and optimized)
   * @param jobId Job ID
   * @returns Promise resolving to job details
   */
  async getJobPostingDetails(jobId: string) {
    const startTime = Date.now();
    
    // Try to get from cache first
    const cacheKey = `details_${jobId}`;
    const cachedDetails = cacheService.get(cacheKey, 'query');
    if (cachedDetails) {
      this.trackPerformance(startTime, true);
      return cachedDetails;
    }
    
    // Not in cache, fetch job first
    const job = await this.getJobById(jobId);
    if (!job) return null;
    
    // Fetch related data in parallel
    try {
      const [
        candidates,
        hiringManager
      ] = await Promise.all([
        this.getCandidatesByJobId(jobId),
        this.getEmployeeById(job.hiringManager)
      ]);
      
      const jobDetails = {
        job,
        candidates,
        hiringManager
      };
      
      // Store in cache
      cacheService.set(cacheKey, jobDetails, { 
        category: 'query',
        ttl: 10 * 60 * 1000 // 10 minutes TTL for job details
      });
      
      this.trackPerformance(startTime, false);
      return jobDetails;
    } catch (error) {
      console.error(`Error fetching details for job ${jobId}:`, error);
      throw error;
    }
  }
  
  // ===== Task Functions =====
  
  /**
   * Get all talent tasks (cached)
   */
  async getTalentTasks(): Promise<TalentTask[]> {
    const startTime = Date.now();
    
    // Try to get from cache first
    const cachedTasks = cacheService.get<TalentTask[]>('all_talent', 'tasks');
    if (cachedTasks) {
      this.trackPerformance(startTime, true);
      return cachedTasks;
    }
    
    // Not in cache, load from service
    try {
      const tasks = await dataService.getTalentTasks();
      
      // Store in cache (shorter TTL for tasks as they change frequently)
      cacheService.set('all_talent', tasks, { 
        category: 'tasks',
        ttl: 5 * 60 * 1000 // 5 minutes TTL for tasks
      });
      
      this.trackPerformance(startTime, false);
      return tasks;
    } catch (error) {
      console.error('Error fetching talent tasks:', error);
      throw error;
    }
  }
  
  /**
   * Get talent tasks by manager ID (cached)
   */
  async getTalentTasksByManagerId(managerId: string): Promise<TalentTask[]> {
    const startTime = Date.now();
    
    // Try to get from cache first
    const cacheKey = `manager_${managerId}_talent`;
    const cachedTasks = cacheService.get<TalentTask[]>(cacheKey, 'tasks');
    if (cachedTasks) {
      this.trackPerformance(startTime, true);
      return cachedTasks;
    }
    
    // Not in cache, fetch from service
    try {
      const tasks = await dataService.getTalentTasksByManagerId(managerId);
      
      // Store in cache with shorter TTL
      cacheService.set(cacheKey, tasks, { 
        category: 'tasks',
        ttl: 5 * 60 * 1000 // 5 minutes TTL for manager-specific tasks
      });
      
      this.trackPerformance(startTime, false);
      return tasks;
    } catch (error) {
      console.error(`Error fetching talent tasks for manager ${managerId}:`, error);
      throw error;
    }
  }
  
  /**
   * Get all recognition tasks (cached)
   */
  async getRecognitionTasks(): Promise<RecognitionTask[]> {
    const startTime = Date.now();
    
    // Try to get from cache first
    const cachedTasks = cacheService.get<RecognitionTask[]>('all_recognition', 'tasks');
    if (cachedTasks) {
      this.trackPerformance(startTime, true);
      return cachedTasks;
    }
    
    // Not in cache, load from service
    try {
      const tasks = await dataService.getRecognitionTasks();
      
      // Store in cache (shorter TTL for tasks as they change frequently)
      cacheService.set('all_recognition', tasks, { 
        category: 'tasks',
        ttl: 5 * 60 * 1000 // 5 minutes TTL for tasks
      });
      
      this.trackPerformance(startTime, false);
      return tasks;
    } catch (error) {
      console.error('Error fetching recognition tasks:', error);
      throw error;
    }
  }
  
  /**
   * Get recognition tasks by manager ID (cached)
   */
  async getRecognitionTasksByManagerId(managerId: string): Promise<RecognitionTask[]> {
    const startTime = Date.now();
    
    // Try to get from cache first
    const cacheKey = `manager_${managerId}_recognition`;
    const cachedTasks = cacheService.get<RecognitionTask[]>(cacheKey, 'tasks');
    if (cachedTasks) {
      this.trackPerformance(startTime, true);
      return cachedTasks;
    }
    
    // Not in cache, fetch from service
    try {
      const tasks = await dataService.getRecognitionTasksByManagerId(managerId);
      
      // Store in cache with shorter TTL
      cacheService.set(cacheKey, tasks, { 
        category: 'tasks',
        ttl: 5 * 60 * 1000 // 5 minutes TTL for manager-specific tasks
      });
      
      this.trackPerformance(startTime, false);
      return tasks;
    } catch (error) {
      console.error(`Error fetching recognition tasks for manager ${managerId}:`, error);
      throw error;
    }
  }
  
  /**
   * Get all shift tasks (cached)
   */
  async getShiftTasks(): Promise<ShiftTask[]> {
    const startTime = Date.now();
    
    // Try to get from cache first
    const cachedTasks = cacheService.get<ShiftTask[]>('all_shift', 'tasks');
    if (cachedTasks) {
      this.trackPerformance(startTime, true);
      return cachedTasks;
    }
    
    // Not in cache, load from service
    try {
      const tasks = await dataService.getShiftTasks();
      
      // Store in cache (shorter TTL for tasks as they change frequently)
      cacheService.set('all_shift', tasks, { 
        category: 'tasks',
        ttl: 5 * 60 * 1000 // 5 minutes TTL for tasks
      });
      
      this.trackPerformance(startTime, false);
      return tasks;
    } catch (error) {
      console.error('Error fetching shift tasks:', error);
      throw error;
    }
  }
  
  /**
   * Get shift tasks by manager ID (cached)
   */
  async getShiftTasksByManagerId(managerId: string): Promise<ShiftTask[]> {
    const startTime = Date.now();
    
    // Try to get from cache first
    const cacheKey = `manager_${managerId}_shift`;
    const cachedTasks = cacheService.get<ShiftTask[]>(cacheKey, 'tasks');
    if (cachedTasks) {
      this.trackPerformance(startTime, true);
      return cachedTasks;
    }
    
    // Not in cache, fetch from service
    try {
      const tasks = await dataService.getShiftTasksByManagerId(managerId);
      
      // Store in cache with shorter TTL
      cacheService.set(cacheKey, tasks, { 
        category: 'tasks',
        ttl: 5 * 60 * 1000 // 5 minutes TTL for manager-specific tasks
      });
      
      this.trackPerformance(startTime, false);
      return tasks;
    } catch (error) {
      console.error(`Error fetching shift tasks for manager ${managerId}:`, error);
      throw error;
    }
  }
  
  /**
   * Clear cache for specific entity types (used when data is updated)
   * @param entityTypes Array of entity types to clear
   */
  clearCache(entityTypes: string[]): void {
    for (const entityType of entityTypes) {
      switch (entityType) {
        case 'employees':
          cacheService.clearCategory('employees');
          // Also clear related caches
          cacheService.clearCategory('relationships');
          break;
        case 'jobs':
          cacheService.clearCategory('jobs');
          break;
        case 'candidates':
          cacheService.clearCategory('candidates');
          break;
        case 'shifts':
          cacheService.clearCategory('shifts');
          break;
        case 'tasks':
          cacheService.clearCategory('tasks');
          break;
        case 'recognition':
          cacheService.clearCategory('recognition');
          break;
        case 'query':
          cacheService.clearCategory('query');
          break;
        case 'all':
          cacheService.clear();
          break;
      }
    }
    
    console.info(`Cleared cache for entity types: ${entityTypes.join(', ')}`);
  }
}

// Export a singleton instance
const optimizedDataService = new OptimizedDataService();
export default optimizedDataService;