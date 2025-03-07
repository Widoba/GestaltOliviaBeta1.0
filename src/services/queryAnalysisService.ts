/**
 * Service for analyzing user queries to extract entities and intents
 */
import dataService from './dataService';
import { Employee, Job, Candidate, Shift } from './dataService';

// Types of entities that can be detected
export enum EntityType {
  EMPLOYEE = 'employee',
  CANDIDATE = 'candidate',
  JOB = 'job',
  DEPARTMENT = 'department',
  DATE = 'date',
  TIME_PERIOD = 'time_period',
  LOCATION = 'location',
  SKILL = 'skill',
  TASK = 'task',
}

// Entity detection result
export interface DetectedEntity {
  type: EntityType;
  value: string;
  originalText: string;
  confidence: number;
  id?: string; // If we can match to a specific entity ID
  metadata?: Record<string, any>; // Additional information about the entity
}

// Intent categories
export enum IntentCategory {
  EMPLOYEE_INFO = 'employee_info',
  SCHEDULE_MANAGEMENT = 'schedule_management',
  TASK_MANAGEMENT = 'task_management',
  RECOGNITION = 'recognition',
  JOB_MANAGEMENT = 'job_management',
  CANDIDATE_MANAGEMENT = 'candidate_management',
  INTERVIEW_PROCESS = 'interview_process',
  HIRING_WORKFLOW = 'hiring_workflow',
  GENERAL_QUESTION = 'general_question',
}

// Intent detection result
export interface DetectedIntent {
  category: IntentCategory;
  confidence: number;
  subIntents?: string[]; // More specific intents within category
  requiresData?: boolean; // Whether this intent likely needs data
}

// Analysis result containing both entities and intents
export interface QueryAnalysis {
  entities: DetectedEntity[];
  primaryIntent: DetectedIntent;
  secondaryIntents: DetectedIntent[];
  assistantType: 'employee' | 'talent' | 'unified';
  confidenceScore: number;
  requiresData: boolean;
}

/**
 * Service for analyzing user queries
 */
class QueryAnalysisService {
  // Cache frequently used data
  private employeeNameCache: Map<string, string> = new Map(); // name -> id
  private candidateNameCache: Map<string, string> = new Map(); // name -> id
  private jobTitleCache: Map<string, string> = new Map(); // title -> id
  private departmentCache: Set<string> = new Set();
  
  constructor() {
    // Initialize caches
    this.initializeCaches();
  }
  
  /**
   * Initialize caches with data for faster lookups
   */
  private async initializeCaches(): Promise<void> {
    try {
      // Cache employee names
      const employees = await dataService.getEmployees();
      employees.forEach(employee => {
        const fullName = `${employee.firstName} ${employee.lastName}`.toLowerCase();
        this.employeeNameCache.set(fullName, employee.id);
        this.employeeNameCache.set(employee.firstName.toLowerCase(), employee.id);
        this.employeeNameCache.set(employee.lastName.toLowerCase(), employee.id);
      });
      
      // Cache candidate names
      const candidates = await dataService.getCandidates();
      candidates.forEach(candidate => {
        const fullName = `${candidate.firstName} ${candidate.lastName}`.toLowerCase();
        this.candidateNameCache.set(fullName, candidate.id);
        this.candidateNameCache.set(candidate.firstName.toLowerCase(), candidate.id);
        this.candidateNameCache.set(candidate.lastName.toLowerCase(), candidate.id);
      });
      
      // Cache job titles
      const jobs = await dataService.getJobs();
      jobs.forEach(job => {
        this.jobTitleCache.set(job.title.toLowerCase(), job.id);
        // Also cache position without level (e.g., "Developer" for "Senior Developer")
        const baseTitle = job.title.replace(/^(Junior|Senior|Lead|Principal|Chief)\s+/, '').toLowerCase();
        if (baseTitle !== job.title.toLowerCase()) {
          this.jobTitleCache.set(baseTitle, job.id);
        }
      });
      
      // Cache departments
      employees.forEach(employee => {
        this.departmentCache.add(employee.department.toLowerCase());
      });
      
    } catch (error) {
      console.error('Error initializing entity caches:', error);
    }
  }
  
  /**
   * Analyze a user query for entities and intents
   * @param query User query text
   * @returns Analysis result with entities and intents
   */
  async analyzeQuery(query: string): Promise<QueryAnalysis> {
    const lowerQuery = query.toLowerCase();
    
    // Detect entities
    const entities = await this.detectEntities(lowerQuery);
    
    // Detect intents
    const intents = this.detectIntents(lowerQuery, entities);
    
    // Determine primary intent (highest confidence)
    const sortedIntents = [...intents].sort((a, b) => b.confidence - a.confidence);
    const primaryIntent = sortedIntents[0];
    const secondaryIntents = sortedIntents.slice(1);
    
    // Determine assistant type based on intents
    const assistantType = this.determineAssistantType(primaryIntent, secondaryIntents);
    
    // Calculate overall confidence
    const confidenceScore = this.calculateConfidenceScore(primaryIntent, entities);
    
    // Determine if data is required
    const requiresData = primaryIntent.requiresData || 
      entities.length > 0 || 
      secondaryIntents.some(intent => intent.requiresData && intent.confidence > 0.4);
    
    return {
      entities,
      primaryIntent,
      secondaryIntents,
      assistantType,
      confidenceScore,
      requiresData
    };
  }
  
  /**
   * Detect entities in the query
   * @param query Lowercase query text
   * @returns Array of detected entities
   */
  private async detectEntities(query: string): Promise<DetectedEntity[]> {
    const entities: DetectedEntity[] = [];
    
    // Detect employees
    await this.detectEmployees(query, entities);
    
    // Detect candidates
    await this.detectCandidates(query, entities);
    
    // Detect jobs
    await this.detectJobs(query, entities);
    
    // Detect departments
    this.detectDepartments(query, entities);
    
    // Detect dates and time periods
    this.detectDates(query, entities);
    
    // Detect locations
    this.detectLocations(query, entities);
    
    // Remove duplicates or overlapping entities
    return this.deduplicateEntities(entities);
  }
  
  /**
   * Detect employee entities in the query
   * @param query Lowercase query text
   * @param entities Array to add detected entities to
   */
  private async detectEmployees(query: string, entities: DetectedEntity[]): Promise<void> {
    // Check cache for known employee names
    for (const [name, id] of this.employeeNameCache.entries()) {
      if (query.includes(name)) {
        try {
          const employee = await dataService.getEmployeeById(id);
          if (employee) {
            entities.push({
              type: EntityType.EMPLOYEE,
              value: `${employee.firstName} ${employee.lastName}`,
              originalText: name,
              confidence: this.calculateEntityConfidence(name, query),
              id: employee.id,
              metadata: {
                position: employee.position,
                department: employee.department
              }
            });
          }
        } catch (error) {
          console.error(`Error fetching employee data for ${id}:`, error);
        }
      }
    }
    
    // Check for employee IDs (e.g., "E001")
    const employeeIdPattern = /\b(E\d{3})\b/g;
    let match;
    while ((match = employeeIdPattern.exec(query)) !== null) {
      try {
        const id = match[1];
        const employee = await dataService.getEmployeeById(id);
        if (employee) {
          entities.push({
            type: EntityType.EMPLOYEE,
            value: `${employee.firstName} ${employee.lastName}`,
            originalText: id,
            confidence: 0.95, // High confidence for exact ID match
            id: employee.id,
            metadata: {
              position: employee.position,
              department: employee.department
            }
          });
        }
      } catch (error) {
        console.error(`Error fetching employee data for ID match:`, error);
      }
    }
  }
  
  /**
   * Detect candidate entities in the query
   * @param query Lowercase query text
   * @param entities Array to add detected entities to
   */
  private async detectCandidates(query: string, entities: DetectedEntity[]): Promise<void> {
    // Check cache for known candidate names
    for (const [name, id] of this.candidateNameCache.entries()) {
      if (query.includes(name)) {
        try {
          const candidate = await dataService.getCandidateById(id);
          if (candidate) {
            entities.push({
              type: EntityType.CANDIDATE,
              value: `${candidate.firstName} ${candidate.lastName}`,
              originalText: name,
              confidence: this.calculateEntityConfidence(name, query),
              id: candidate.id,
              metadata: {
                jobId: candidate.jobId,
                stage: candidate.stage
              }
            });
          }
        } catch (error) {
          console.error(`Error fetching candidate data for ${id}:`, error);
        }
      }
    }
    
    // Check for candidate IDs (e.g., "C001")
    const candidateIdPattern = /\b(C\d{3})\b/g;
    let match;
    while ((match = candidateIdPattern.exec(query)) !== null) {
      try {
        const id = match[1];
        const candidate = await dataService.getCandidateById(id);
        if (candidate) {
          entities.push({
            type: EntityType.CANDIDATE,
            value: `${candidate.firstName} ${candidate.lastName}`,
            originalText: id,
            confidence: 0.95, // High confidence for exact ID match
            id: candidate.id,
            metadata: {
              jobId: candidate.jobId,
              stage: candidate.stage
            }
          });
        }
      } catch (error) {
        console.error(`Error fetching candidate data for ID match:`, error);
      }
    }
  }
  
  /**
   * Detect job entities in the query
   * @param query Lowercase query text
   * @param entities Array to add detected entities to
   */
  private async detectJobs(query: string, entities: DetectedEntity[]): Promise<void> {
    // Check cache for known job titles
    for (const [title, id] of this.jobTitleCache.entries()) {
      if (query.includes(title)) {
        try {
          const job = await dataService.getJobById(id);
          if (job) {
            entities.push({
              type: EntityType.JOB,
              value: job.title,
              originalText: title,
              confidence: this.calculateEntityConfidence(title, query),
              id: job.id,
              metadata: {
                department: job.department,
                status: job.status
              }
            });
          }
        } catch (error) {
          console.error(`Error fetching job data for ${id}:`, error);
        }
      }
    }
    
    // Check for job IDs (e.g., "J001")
    const jobIdPattern = /\b(J\d{3})\b/g;
    let match;
    while ((match = jobIdPattern.exec(query)) !== null) {
      try {
        const id = match[1];
        const job = await dataService.getJobById(id);
        if (job) {
          entities.push({
            type: EntityType.JOB,
            value: job.title,
            originalText: id,
            confidence: 0.95, // High confidence for exact ID match
            id: job.id,
            metadata: {
              department: job.department,
              status: job.status
            }
          });
        }
      } catch (error) {
        console.error(`Error fetching job data for ID match:`, error);
      }
    }
    
    // Check for common job title patterns
    const jobPatterns = [
      /\b(senior|junior|lead|principal|chief)?\s*(software|frontend|backend|fullstack|web|mobile|data|cloud|devops|qa|test|security)\s*(engineer|developer|architect|analyst|specialist|manager)\b/,
      /\b(marketing|sales|hr|finance|product|project|program)\s*(director|manager|specialist|coordinator|assistant)\b/,
      /\b(ux|ui)\s*(designer|researcher)\b/
    ];
    
    // Check each pattern
    for (const pattern of jobPatterns) {
      const matches = query.match(pattern);
      if (matches) {
        const jobTitle = matches[0];
        // Check if we have an exact match in cache
        if (!entities.some(e => e.type === EntityType.JOB && e.originalText === jobTitle)) {
          entities.push({
            type: EntityType.JOB,
            value: jobTitle,
            originalText: jobTitle,
            confidence: 0.7, // Medium confidence for pattern match
          });
        }
      }
    }
  }
  
  /**
   * Detect department entities in the query
   * @param query Lowercase query text
   * @param entities Array to add detected entities to
   */
  private detectDepartments(query: string, entities: DetectedEntity[]): void {
    // Check for known departments
    for (const department of this.departmentCache) {
      if (query.includes(department)) {
        entities.push({
          type: EntityType.DEPARTMENT,
          value: department,
          originalText: department,
          confidence: this.calculateEntityConfidence(department, query)
        });
      }
    }
  }
  
  /**
   * Detect date entities in the query
   * @param query Lowercase query text
   * @param entities Array to add detected entities to
   */
  private detectDates(query: string, entities: DetectedEntity[]): void {
    // Check for specific dates (YYYY-MM-DD format)
    const isoDatePattern = /\b(\d{4}-\d{2}-\d{2})\b/g;
    let match;
    while ((match = isoDatePattern.exec(query)) !== null) {
      entities.push({
        type: EntityType.DATE,
        value: match[1],
        originalText: match[1],
        confidence: 0.95 // High confidence for ISO dates
      });
    }
    
    // Check for date ranges
    const dateRangePattern = /\b(\d{4}-\d{2}-\d{2})\s+to\s+(\d{4}-\d{2}-\d{2})\b/i;
    const rangeMatch = query.match(dateRangePattern);
    if (rangeMatch) {
      entities.push({
        type: EntityType.TIME_PERIOD,
        value: `${rangeMatch[1]} to ${rangeMatch[2]}`,
        originalText: rangeMatch[0],
        confidence: 0.9,
        metadata: {
          startDate: rangeMatch[1],
          endDate: rangeMatch[2]
        }
      });
    }
    
    // Check for relative time periods
    const timePeriods = [
      { pattern: /\bnext week\b/i, value: 'next_week' },
      { pattern: /\bthis week\b/i, value: 'this_week' },
      { pattern: /\blast week\b/i, value: 'last_week' },
      { pattern: /\bnext month\b/i, value: 'next_month' },
      { pattern: /\bthis month\b/i, value: 'this_month' },
      { pattern: /\blast month\b/i, value: 'last_month' },
      { pattern: /\btoday\b/i, value: 'today' },
      { pattern: /\btomorrow\b/i, value: 'tomorrow' },
      { pattern: /\byesterday\b/i, value: 'yesterday' },
      { pattern: /\bq[1-4]\b/i, value: 'quarter' }, // Q1, Q2, etc.
    ];
    
    for (const period of timePeriods) {
      if (period.pattern.test(query)) {
        const match = query.match(period.pattern)![0];
        entities.push({
          type: EntityType.TIME_PERIOD,
          value: period.value,
          originalText: match,
          confidence: 0.85
        });
      }
    }
  }
  
  /**
   * Detect location entities in the query
   * @param query Lowercase query text
   * @param entities Array to add detected entities to
   */
  private detectLocations(query: string, entities: DetectedEntity[]): void {
    // Common office locations
    const locations = [
      'new york', 'san francisco', 'chicago', 'boston', 'los angeles',
      'seattle', 'austin', 'denver', 'miami', 'atlanta', 'remote', 'hybrid'
    ];
    
    for (const location of locations) {
      if (query.includes(location)) {
        entities.push({
          type: EntityType.LOCATION,
          value: location,
          originalText: location,
          confidence: this.calculateEntityConfidence(location, query)
        });
      }
    }
    
    // Office/remote work patterns
    const workLocations = [
      { pattern: /\bin\s*office\b/i, value: 'in_office' },
      { pattern: /\bremote\b/i, value: 'remote' },
      { pattern: /\bhybrid\b/i, value: 'hybrid' },
      { pattern: /\bin\s*person\b/i, value: 'in_office' },
      { pattern: /\bwfh\b/i, value: 'remote' }, // work from home
    ];
    
    for (const location of workLocations) {
      if (location.pattern.test(query)) {
        const match = query.match(location.pattern)![0];
        entities.push({
          type: EntityType.LOCATION,
          value: location.value,
          originalText: match,
          confidence: 0.8
        });
      }
    }
  }
  
  /**
   * Calculate confidence score for an entity match
   * @param matchText The matched text
   * @param fullQuery The full query
   * @returns Confidence score between 0 and 1
   */
  private calculateEntityConfidence(matchText: string, fullQuery: string): number {
    // Exact phrase matches get higher confidence
    if (fullQuery.includes(` ${matchText} `)) {
      return 0.9;
    }
    
    // Matches at start or end of query get medium confidence
    if (fullQuery.startsWith(matchText) || fullQuery.endsWith(matchText)) {
      return 0.8;
    }
    
    // Substring matches get lower confidence
    return 0.7;
  }
  
  /**
   * Remove duplicate or overlapping entities
   * @param entities List of detected entities
   * @returns Deduplicated entity list
   */
  private deduplicateEntities(entities: DetectedEntity[]): DetectedEntity[] {
    // Sort by confidence (highest first)
    const sorted = [...entities].sort((a, b) => b.confidence - a.confidence);
    const result: DetectedEntity[] = [];
    
    for (const entity of sorted) {
      // Check if this entity overlaps with any already in result
      const overlaps = result.some(e => 
        e.type === entity.type && 
        (e.value === entity.value || e.originalText === entity.originalText)
      );
      
      if (!overlaps) {
        result.push(entity);
      }
    }
    
    return result;
  }
  
  /**
   * Detect intents in the query
   * @param query Lowercase query text
   * @param entities Detected entities
   * @returns Array of detected intents
   */
  private detectIntents(query: string, entities: DetectedEntity[]): DetectedIntent[] {
    const intents: DetectedIntent[] = [];
    
    // Detect employee info intent
    this.detectEmployeeInfoIntent(query, entities, intents);
    
    // Detect schedule management intent
    this.detectScheduleIntent(query, entities, intents);
    
    // Detect task management intent
    this.detectTaskIntent(query, entities, intents);
    
    // Detect recognition intent
    this.detectRecognitionIntent(query, entities, intents);
    
    // Detect job management intent
    this.detectJobIntent(query, entities, intents);
    
    // Detect candidate management intent
    this.detectCandidateIntent(query, entities, intents);
    
    // Detect interview process intent
    this.detectInterviewIntent(query, entities, intents);
    
    // Detect hiring workflow intent
    this.detectHiringIntent(query, entities, intents);
    
    // Add general question intent with low confidence as fallback
    intents.push({
      category: IntentCategory.GENERAL_QUESTION,
      confidence: 0.3,
      requiresData: false
    });
    
    return intents;
  }
  
  /**
   * Detect employee info intent
   * @param query Lowercase query text
   * @param entities Detected entities
   * @param intents Array to add detected intents to
   */
  private detectEmployeeInfoIntent(query: string, entities: DetectedEntity[], intents: DetectedIntent[]): void {
    // Check for employee entities
    const hasEmployeeEntity = entities.some(e => e.type === EntityType.EMPLOYEE);
    
    // Check for employee info keywords
    const employeeInfoKeywords = [
      'who is', 'about', 'profile', 'contact', 'information', 'details',
      'email', 'phone', 'skills', 'experience', 'role', 'position',
      'manager', 'reports to', 'works for', 'team', 'start date', 'tenure'
    ];
    
    // Calculate score based on keyword matches
    let score = 0;
    let matchCount = 0;
    
    for (const keyword of employeeInfoKeywords) {
      if (query.includes(keyword)) {
        score += 0.15;
        matchCount++;
      }
    }
    
    // Boost score if employee entity is detected
    if (hasEmployeeEntity) {
      score += 0.4;
    }
    
    // Cap score at 0.95
    score = Math.min(0.95, score);
    
    // Add intent if score is significant
    if (score > 0.3 || (hasEmployeeEntity && score > 0.1)) {
      intents.push({
        category: IntentCategory.EMPLOYEE_INFO,
        confidence: score,
        subIntents: this.determineEmployeeInfoSubIntents(query),
        requiresData: true
      });
    }
  }
  
  /**
   * Determine employee info sub-intents
   * @param query Lowercase query text
   * @returns Array of sub-intent strings
   */
  private determineEmployeeInfoSubIntents(query: string): string[] {
    const subIntents: string[] = [];
    
    if (/contact|email|phone|reach/.test(query)) {
      subIntents.push('contact_info');
    }
    
    if (/skill|expertise|know|able|capable/.test(query)) {
      subIntents.push('skills_info');
    }
    
    if (/role|position|job|title|responsibility/.test(query)) {
      subIntents.push('role_info');
    }
    
    if (/team|department|group|division/.test(query)) {
      subIntents.push('team_info');
    }
    
    if (/manager|report|supervisor/.test(query)) {
      subIntents.push('manager_info');
    }
    
    if (/start|hire|join|tenure/.test(query)) {
      subIntents.push('employment_info');
    }
    
    return subIntents;
  }
  
  /**
   * Detect schedule management intent
   * @param query Lowercase query text
   * @param entities Detected entities
   * @param intents Array to add detected intents to
   */
  private detectScheduleIntent(query: string, entities: DetectedEntity[], intents: DetectedIntent[]): void {
    // Check for relevant entities
    const hasEmployeeEntity = entities.some(e => e.type === EntityType.EMPLOYEE);
    const hasDateEntity = entities.some(e => e.type === EntityType.DATE || e.type === EntityType.TIME_PERIOD);
    
    // Check for schedule keywords
    const scheduleKeywords = [
      'schedule', 'shift', 'shifts', 'working', 'hours', 'time off', 'pto',
      'vacation', 'leave', 'availability', 'work days', 'calendar', 'roster',
      'on duty', 'sick leave', 'absent', 'coverage'
    ];
    
    // Calculate score based on keyword matches
    let score = 0;
    let matchCount = 0;
    
    for (const keyword of scheduleKeywords) {
      if (query.includes(keyword)) {
        score += 0.15;
        matchCount++;
      }
    }
    
    // Boost score based on entity types
    if (hasEmployeeEntity) score += 0.2;
    if (hasDateEntity) score += 0.3;
    
    // Cap score at 0.95
    score = Math.min(0.95, score);
    
    // Add intent if score is significant
    if (score > 0.3 || (hasDateEntity && score > 0.2)) {
      intents.push({
        category: IntentCategory.SCHEDULE_MANAGEMENT,
        confidence: score,
        subIntents: this.determineScheduleSubIntents(query),
        requiresData: true
      });
    }
  }
  
  /**
   * Determine schedule management sub-intents
   * @param query Lowercase query text
   * @returns Array of sub-intent strings
   */
  private determineScheduleSubIntents(query: string): string[] {
    const subIntents: string[] = [];
    
    if (/view|show|see|get|what|display/.test(query)) {
      subIntents.push('view_schedule');
    }
    
    if (/time off|pto|vacation|leave|sick/.test(query)) {
      subIntents.push('time_off_management');
    }
    
    if (/change|update|modify|edit|adjust/.test(query)) {
      subIntents.push('modify_schedule');
    }
    
    if (/assign|set|create|new/.test(query)) {
      subIntents.push('create_schedule');
    }
    
    if (/approve|review|request/.test(query)) {
      subIntents.push('approve_schedule');
    }
    
    if (/coverage|available|capacity|resource/.test(query)) {
      subIntents.push('coverage_planning');
    }
    
    return subIntents;
  }
  
  /**
   * Detect task management intent
   * @param query Lowercase query text
   * @param entities Detected entities
   * @param intents Array to add detected intents to
   */
  private detectTaskIntent(query: string, entities: DetectedEntity[], intents: DetectedIntent[]): void {
    // Check for relevant entities
    const hasEmployeeEntity = entities.some(e => e.type === EntityType.EMPLOYEE);
    const hasDateEntity = entities.some(e => e.type === EntityType.DATE || e.type === EntityType.TIME_PERIOD);
    
    // Check for task keywords
    const taskKeywords = [
      'task', 'tasks', 'to do', 'todo', 'assignment', 'action item', 
      'deliverable', 'due', 'deadline', 'pending', 'complete', 'status',
      'progress', 'assigned', 'overdue', 'priority', 'backlog'
    ];
    
    // Calculate score based on keyword matches
    let score = 0;
    let matchCount = 0;
    
    for (const keyword of taskKeywords) {
      if (query.includes(keyword)) {
        score += 0.2;
        matchCount++;
      }
    }
    
    // Boost score based on entity types
    if (hasEmployeeEntity) score += 0.2;
    if (hasDateEntity) score += 0.1;
    
    // Cap score at 0.95
    score = Math.min(0.95, score);
    
    // Add intent if score is significant
    if (score > 0.3) {
      intents.push({
        category: IntentCategory.TASK_MANAGEMENT,
        confidence: score,
        subIntents: this.determineTaskSubIntents(query),
        requiresData: true
      });
    }
  }
  
  /**
   * Determine task management sub-intents
   * @param query Lowercase query text
   * @returns Array of sub-intent strings
   */
  private determineTaskSubIntents(query: string): string[] {
    const subIntents: string[] = [];
    
    if (/view|show|see|get|what|display|list/.test(query)) {
      subIntents.push('view_tasks');
    }
    
    if (/assign|give|set|create|new|add/.test(query)) {
      subIntents.push('assign_task');
    }
    
    if (/update|change|modify|edit/.test(query)) {
      subIntents.push('update_task');
    }
    
    if (/complete|done|finish|mark|check off/.test(query)) {
      subIntents.push('complete_task');
    }
    
    if (/status|progress|update/.test(query)) {
      subIntents.push('task_status');
    }
    
    if (/due|deadline|overdue|late/.test(query)) {
      subIntents.push('task_deadlines');
    }
    
    if (/priority|important|urgent/.test(query)) {
      subIntents.push('task_priority');
    }
    
    return subIntents;
  }
  
  /**
   * Detect recognition intent
   * @param query Lowercase query text
   * @param entities Detected entities
   * @param intents Array to add detected intents to
   */
  private detectRecognitionIntent(query: string, entities: DetectedEntity[], intents: DetectedIntent[]): void {
    // Check for relevant entities
    const hasEmployeeEntity = entities.some(e => e.type === EntityType.EMPLOYEE);
    
    // Check for recognition keywords
    const recognitionKeywords = [
      'recognize', 'recognition', 'acknowledge', 'praise', 'compliment',
      'appreciate', 'appreciation', 'thank', 'thanks', 'reward', 'achievement',
      'celebrate', 'celebration', 'milestone', 'kudos', 'shoutout', 'highlight'
    ];
    
    // Calculate score based on keyword matches
    let score = 0;
    let matchCount = 0;
    
    for (const keyword of recognitionKeywords) {
      if (query.includes(keyword)) {
        score += 0.2;
        matchCount++;
      }
    }
    
    // Boost score based on entity types
    if (hasEmployeeEntity) score += 0.3;
    
    // Cap score at 0.95
    score = Math.min(0.95, score);
    
    // Add intent if score is significant
    if (score > 0.3 || (hasEmployeeEntity && query.includes('good job'))) {
      intents.push({
        category: IntentCategory.RECOGNITION,
        confidence: score,
        subIntents: this.determineRecognitionSubIntents(query),
        requiresData: true
      });
    }
  }
  
  /**
   * Determine recognition sub-intents
   * @param query Lowercase query text
   * @returns Array of sub-intent strings
   */
  private determineRecognitionSubIntents(query: string): string[] {
    const subIntents: string[] = [];
    
    if (/create|new|add|give|send|make/.test(query)) {
      subIntents.push('create_recognition');
    }
    
    if (/view|show|see|get|display|list|history/.test(query)) {
      subIntents.push('view_recognitions');
    }
    
    if (/option|type|way|method|how/.test(query)) {
      subIntents.push('recognition_options');
    }
    
    if (/team|group|department|all/.test(query)) {
      subIntents.push('team_recognition');
    }
    
    if (/milestone|anniversary|birthday|year/.test(query)) {
      subIntents.push('milestone_recognition');
    }
    
    if (/points|reward|gift|bonus|incentive/.test(query)) {
      subIntents.push('reward_recognition');
    }
    
    return subIntents;
  }
  
  /**
   * Detect job management intent
   * @param query Lowercase query text
   * @param entities Detected entities
   * @param intents Array to add detected intents to
   */
  private detectJobIntent(query: string, entities: DetectedEntity[], intents: DetectedIntent[]): void {
    // Check for relevant entities
    const hasJobEntity = entities.some(e => e.type === EntityType.JOB);
    const hasDepartmentEntity = entities.some(e => e.type === EntityType.DEPARTMENT);
    
    // Check for job management keywords
    const jobKeywords = [
      'job', 'position', 'opening', 'requisition', 'req', 'vacancy',
      'hiring', 'role', 'posting', 'description', 'jd', 'listing',
      'open position', 'requirements', 'qualifications', 'salary'
    ];
    
    // Calculate score based on keyword matches
    let score = 0;
    let matchCount = 0;
    
    for (const keyword of jobKeywords) {
      if (query.includes(keyword)) {
        score += 0.15;
        matchCount++;
      }
    }
    
    // Boost score based on entity types
    if (hasJobEntity) score += 0.4;
    if (hasDepartmentEntity) score += 0.1;
    
    // Cap score at 0.95
    score = Math.min(0.95, score);
    
    // Add intent if score is significant
    if (score > 0.3 || hasJobEntity) {
      intents.push({
        category: IntentCategory.JOB_MANAGEMENT,
        confidence: score,
        subIntents: this.determineJobSubIntents(query),
        requiresData: true
      });
    }
  }
  
  /**
   * Determine job management sub-intents
   * @param query Lowercase query text
   * @returns Array of sub-intent strings
   */
  private determineJobSubIntents(query: string): string[] {
    const subIntents: string[] = [];
    
    if (/view|show|see|get|display|list|open|available/.test(query)) {
      subIntents.push('view_jobs');
    }
    
    if (/create|new|add|open|post|draft/.test(query)) {
      subIntents.push('create_job');
    }
    
    if (/update|change|modify|edit|revise/.test(query)) {
      subIntents.push('update_job');
    }
    
    if (/close|remove|archive|cancel|delete/.test(query)) {
      subIntents.push('close_job');
    }
    
    if (/status|progress|applicants|candidates/.test(query)) {
      subIntents.push('job_status');
    }
    
    if (/description|details|requirements|qualifications/.test(query)) {
      subIntents.push('job_details');
    }
    
    if (/salary|compensation|pay|range|budget/.test(query)) {
      subIntents.push('job_compensation');
    }
    
    return subIntents;
  }
  
  /**
   * Detect candidate management intent
   * @param query Lowercase query text
   * @param entities Detected entities
   * @param intents Array to add detected intents to
   */
  private detectCandidateIntent(query: string, entities: DetectedEntity[], intents: DetectedIntent[]): void {
    // Check for relevant entities
    const hasCandidateEntity = entities.some(e => e.type === EntityType.CANDIDATE);
    const hasJobEntity = entities.some(e => e.type === EntityType.JOB);
    
    // Check for candidate management keywords
    const candidateKeywords = [
      'candidate', 'applicant', 'resume', 'cv', 'application',
      'profile', 'pipeline', 'talent', 'qualified', 'screening', 
      'shortlist', 'recruit', 'background', 'experience'
    ];
    
    // Calculate score based on keyword matches
    let score = 0;
    let matchCount = 0;
    
    for (const keyword of candidateKeywords) {
      if (query.includes(keyword)) {
        score += 0.2;
        matchCount++;
      }
    }
    
    // Boost score based on entity types
    if (hasCandidateEntity) score += 0.4;
    if (hasJobEntity) score += 0.2;
    
    // Cap score at 0.95
    score = Math.min(0.95, score);
    
    // Add intent if score is significant
    if (score > 0.3 || hasCandidateEntity) {
      intents.push({
        category: IntentCategory.CANDIDATE_MANAGEMENT,
        confidence: score,
        subIntents: this.determineCandidateSubIntents(query),
        requiresData: true
      });
    }
  }
  
  /**
   * Determine candidate management sub-intents
   * @param query Lowercase query text
   * @returns Array of sub-intent strings
   */
  private determineCandidateSubIntents(query: string): string[] {
    const subIntents: string[] = [];
    
    if (/view|show|see|get|display|list|all/.test(query)) {
      subIntents.push('view_candidates');
    }
    
    if (/add|new|create|track/.test(query)) {
      subIntents.push('add_candidate');
    }
    
    if (/update|change|modify|edit|status/.test(query)) {
      subIntents.push('update_candidate');
    }
    
    if (/profile|detail|background|experience|qualification|skill/.test(query)) {
      subIntents.push('candidate_details');
    }
    
    if (/status|stage|progress|pipeline/.test(query)) {
      subIntents.push('candidate_status');
    }
    
    if (/resume|cv|attachment|document/.test(query)) {
      subIntents.push('candidate_documents');
    }
    
    return subIntents;
  }
  
  /**
   * Detect interview process intent
   * @param query Lowercase query text
   * @param entities Detected entities
   * @param intents Array to add detected intents to
   */
  private detectInterviewIntent(query: string, entities: DetectedEntity[], intents: DetectedIntent[]): void {
    // Check for relevant entities
    const hasCandidateEntity = entities.some(e => e.type === EntityType.CANDIDATE);
    const hasEmployeeEntity = entities.some(e => e.type === EntityType.EMPLOYEE);
    const hasDateEntity = entities.some(e => e.type === EntityType.DATE || e.type === EntityType.TIME_PERIOD);
    
    // Check for interview process keywords
    const interviewKeywords = [
      'interview', 'interviewing', 'panel', 'feedback', 'assessment',
      'evaluation', 'rating', 'score', 'meeting', 'screen', 'phone screen',
      'technical', 'onsite', 'schedule', 'debrief', 'decision'
    ];
    
    // Calculate score based on keyword matches
    let score = 0;
    let matchCount = 0;
    
    for (const keyword of interviewKeywords) {
      if (query.includes(keyword)) {
        score += 0.15;
        matchCount++;
      }
    }
    
    // Boost score based on entity types
    if (hasCandidateEntity) score += 0.3;
    if (hasEmployeeEntity) score += 0.1;
    if (hasDateEntity) score += 0.1;
    
    // Cap score at 0.95
    score = Math.min(0.95, score);
    
    // Add intent if score is significant
    if (score > 0.3 || (query.includes('interview') && (hasCandidateEntity || hasEmployeeEntity))) {
      intents.push({
        category: IntentCategory.INTERVIEW_PROCESS,
        confidence: score,
        subIntents: this.determineInterviewSubIntents(query),
        requiresData: true
      });
    }
  }
  
  /**
   * Determine interview process sub-intents
   * @param query Lowercase query text
   * @returns Array of sub-intent strings
   */
  private determineInterviewSubIntents(query: string): string[] {
    const subIntents: string[] = [];
    
    if (/schedule|set up|arrange|plan|book|calendar/.test(query)) {
      subIntents.push('schedule_interview');
    }
    
    if (/feedback|review|assessment|evaluation|score|rating/.test(query)) {
      subIntents.push('interview_feedback');
    }
    
    if (/prepare|preparation|question|guide|template/.test(query)) {
      subIntents.push('interview_preparation');
    }
    
    if (/panel|team|group|who|interviewer/.test(query)) {
      subIntents.push('interview_panel');
    }
    
    if (/upcoming|next|scheduled|pending/.test(query)) {
      subIntents.push('upcoming_interviews');
    }
    
    if (/cancel|reschedule|change|move/.test(query)) {
      subIntents.push('modify_interview');
    }
    
    return subIntents;
  }
  
  /**
   * Detect hiring workflow intent
   * @param query Lowercase query text
   * @param entities Detected entities
   * @param intents Array to add detected intents to
   */
  private detectHiringIntent(query: string, entities: DetectedEntity[], intents: DetectedIntent[]): void {
    // Check for relevant entities
    const hasCandidateEntity = entities.some(e => e.type === EntityType.CANDIDATE);
    const hasJobEntity = entities.some(e => e.type === EntityType.JOB);
    
    // Check for hiring workflow keywords
    const hiringKeywords = [
      'offer', 'hire', 'hiring', 'onboarding', 'decision', 'approve', 
      'reject', 'decline', 'compensation', 'salary', 'negotiate',
      'start date', 'background check', 'reference', 'paperwork'
    ];
    
    // Calculate score based on keyword matches
    let score = 0;
    let matchCount = 0;
    
    for (const keyword of hiringKeywords) {
      if (query.includes(keyword)) {
        score += 0.15;
        matchCount++;
      }
    }
    
    // Boost score based on entity types
    if (hasCandidateEntity) score += 0.3;
    if (hasJobEntity) score += 0.2;
    
    // Cap score at 0.95
    score = Math.min(0.95, score);
    
    // Add intent if score is significant
    if (score > 0.3 || (query.includes('offer') && hasCandidateEntity)) {
      intents.push({
        category: IntentCategory.HIRING_WORKFLOW,
        confidence: score,
        subIntents: this.determineHiringSubIntents(query),
        requiresData: true
      });
    }
  }
  
  /**
   * Determine hiring workflow sub-intents
   * @param query Lowercase query text
   * @returns Array of sub-intent strings
   */
  private determineHiringSubIntents(query: string): string[] {
    const subIntents: string[] = [];
    
    if (/offer|extend|proposal|package|comp|salary/.test(query)) {
      subIntents.push('create_offer');
    }
    
    if (/approve|authorize|review|sign off/.test(query)) {
      subIntents.push('approve_offer');
    }
    
    if (/status|update|accepted|declined|pending/.test(query)) {
      subIntents.push('offer_status');
    }
    
    if (/onboarding|first day|start|orientation|welcome/.test(query)) {
      subIntents.push('onboarding');
    }
    
    if (/reject|decline|pass|not moving forward/.test(query)) {
      subIntents.push('reject_candidate');
    }
    
    if (/paperwork|documents|forms|signature|e-sign/.test(query)) {
      subIntents.push('hiring_documents');
    }
    
    if (/background|reference|check|verification/.test(query)) {
      subIntents.push('background_check');
    }
    
    return subIntents;
  }
  
  /**
   * Determine assistant type based on detected intents
   * @param primaryIntent Primary detected intent
   * @param secondaryIntents Secondary detected intents
   * @returns Appropriate assistant type
   */
  private determineAssistantType(
    primaryIntent: DetectedIntent,
    secondaryIntents: DetectedIntent[]
  ): 'employee' | 'talent' | 'unified' {
    // If primary intent is high confidence and clear category, use that
    if (primaryIntent.confidence > 0.6) {
      // Employee assistant intents
      if ([
        IntentCategory.EMPLOYEE_INFO,
        IntentCategory.SCHEDULE_MANAGEMENT,
        IntentCategory.TASK_MANAGEMENT,
        IntentCategory.RECOGNITION
      ].includes(primaryIntent.category)) {
        return 'employee';
      }
      
      // Talent acquisition intents
      if ([
        IntentCategory.JOB_MANAGEMENT,
        IntentCategory.CANDIDATE_MANAGEMENT,
        IntentCategory.INTERVIEW_PROCESS,
        IntentCategory.HIRING_WORKFLOW
      ].includes(primaryIntent.category)) {
        return 'talent';
      }
    }
    
    // If it's not clear from primary intent, look at intent distribution
    let employeeScore = 0;
    let talentScore = 0;
    
    // Process all intents (primary + secondary)
    const allIntents = [primaryIntent, ...secondaryIntents];
    
    for (const intent of allIntents) {
      const weight = intent === primaryIntent ? 1.0 : 0.5; // Primary intent gets full weight
      const scaledConfidence = intent.confidence * weight;
      
      // Add to appropriate score based on category
      if ([
        IntentCategory.EMPLOYEE_INFO,
        IntentCategory.SCHEDULE_MANAGEMENT,
        IntentCategory.TASK_MANAGEMENT,
        IntentCategory.RECOGNITION
      ].includes(intent.category)) {
        employeeScore += scaledConfidence;
      } else if ([
        IntentCategory.JOB_MANAGEMENT,
        IntentCategory.CANDIDATE_MANAGEMENT,
        IntentCategory.INTERVIEW_PROCESS,
        IntentCategory.HIRING_WORKFLOW
      ].includes(intent.category)) {
        talentScore += scaledConfidence;
      }
    }
    
    // Determine assistant type based on scores
    if (employeeScore > talentScore && employeeScore - talentScore > 0.3) {
      return 'employee';
    } else if (talentScore > employeeScore && talentScore - employeeScore > 0.3) {
      return 'talent';
    } else {
      return 'unified';
    }
  }
  
  /**
   * Calculate overall confidence score for the analysis
   * @param primaryIntent Primary detected intent
   * @param entities Detected entities
   * @returns Confidence score between 0 and 1
   */
  private calculateConfidenceScore(primaryIntent: DetectedIntent, entities: DetectedEntity[]): number {
    // Start with primary intent confidence
    let score = primaryIntent.confidence;
    
    // Add bonus for detected entities (up to 0.2)
    const entityBonus = Math.min(0.2, entities.length * 0.05);
    score += entityBonus;
    
    // Cap at 0.95
    return Math.min(0.95, score);
  }
}

// Export a singleton instance
const queryAnalysisService = new QueryAnalysisService();
export default queryAnalysisService;