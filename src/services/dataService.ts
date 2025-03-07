/**
 * Data Service for loading and accessing data files
 */
import { promises as fs } from 'fs';
import path from 'path';

// Employee Data Types
export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  manager: string | null;
  hireDate: string;
  status: string;
  location: string;
  workType: string;
  permissions: string[];
  skills: string[];
}

export interface Employees {
  employees: Employee[];
}

// Shift Data Types
export interface ShiftSchedule {
  day: string;
  startTime: string;
  endTime: string;
  breakTime: string;
}

export interface Shift {
  id: string;
  employeeId: string;
  startDate: string;
  endDate: string;
  schedule: ShiftSchedule[];
  type: string;
  status: string;
  location: string;
}

export interface Shifts {
  shifts: Shift[];
}

// Employee Task Data Types
export interface EmployeeTask {
  id: string;
  employeeId: string;
  taskType: string;
  title: string;
  description: string;
  status: string;
  dueDate: string;
  completedDate?: string;
  priority: string;
  assignedBy: string;
  assignedDate: string;
  relatedItems: string[];
  notes: string;
}

export interface EmployeeTasks {
  employee_tasks: EmployeeTask[];
}

// Talent Task Data Types
export interface TalentTask {
  id: string;
  managerId: string;
  taskType: string;
  title: string;
  description: string;
  status: string;
  dueDate: string;
  completedDate?: string;
  priority: string;
  departmentId?: string;
  candidateId?: string;
  relatedItems: string[];
  notes: string;
}

export interface TalentTasks {
  talent_tasks: TalentTask[];
}

// Recognition Task Data Types
export interface RecognitionTask {
  id: string;
  managerId: string;
  taskType: string;
  title: string;
  description: string;
  status: string;
  dueDate: string;
  completedDate?: string;
  priority: string;
  departmentId?: string;
  employeeId?: string;
  relatedItems: string[];
  notes: string;
}

export interface RecognitionTasks {
  recognition_tasks: RecognitionTask[];
}

// Shift Task Data Types
export interface ShiftTask {
  id: string;
  managerId: string;
  taskType: string;
  title: string;
  description: string;
  status: string;
  dueDate: string;
  completedDate?: string;
  priority: string;
  departmentId?: string;
  employeeId?: string;
  relatedItems: string[];
  notes: string;
}

export interface ShiftTasks {
  shift_tasks: ShiftTask[];
}

// Job Data Types
export interface SalaryRange {
  min: number;
  max: number;
  currency: string;
  commission?: string;
}

export interface Job {
  id: string;
  title: string;
  department: string;
  location: string;
  workType: string;
  postingDate: string;
  closingDate: string;
  status: string;
  description: string;
  requirements: string[];
  salary: SalaryRange;
  hiringManager: string;
  applicationCount: number;
  interviews: number;
  priority: string;
  closeReason?: string;
}

export interface Jobs {
  jobs: Job[];
}

// Candidate Data Types
export interface InterviewFeedback {
  interviewerId: string;
  date: string;
  score: number;
  strengths: string[];
  weaknesses: string[];
  recommendation: string;
}

export interface OfferDetails {
  salary: number;
  bonus?: number;
  startDate: string;
  expirationDate: string;
}

export interface AssessmentResults {
  salesAptitude?: number;
  personalityType?: string;
  strengths: string[];
  areas_for_improvement: string[];
}

export interface Candidate {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  jobId: string;
  stage: string;
  applicationDate: string;
  lastUpdated: string;
  status: string;
  resume: string;
  skills: string[];
  experience: string;
  education: string;
  interviewFeedback?: InterviewFeedback[];
  offerDetails?: OfferDetails;
  assessmentResults?: AssessmentResults;
  notes: string;
}

export interface Candidates {
  candidates: Candidate[];
}

// Recognition Data Types
export interface Recognition {
  id: string;
  type: string;
  employeeId?: string;
  teamId?: string;
  teamName?: string;
  members?: string[];
  recognizedBy?: string;
  date: string;
  description: string;
  category: string;
  visibility: string;
  points?: number;
  gift?: string;
  award?: string;
  awardingOrganization?: string;
  certificationName?: string;
  customerName?: string;
  tags: string[];
}

export interface Recognitions {
  recognition: Recognition[];
}

/**
 * DataService class for loading and accessing data
 */
class DataService {
  private dataDirectory = path.join(process.cwd(), 'src/data');
  
  private async loadData<T>(filename: string): Promise<T> {
    try {
      const filePath = path.join(this.dataDirectory, filename);
      const fileContent = await fs.readFile(filePath, 'utf8');
      return JSON.parse(fileContent) as T;
    } catch (error) {
      console.error(`Error loading data file ${filename}:`, error);
      throw new Error(`Failed to load data from ${filename}`);
    }
  }
  
  // Employee data methods
  async getEmployees(): Promise<Employee[]> {
    const data = await this.loadData<Employees>('employees.json');
    return data.employees;
  }
  
  async getEmployeeById(id: string): Promise<Employee | undefined> {
    const employees = await this.getEmployees();
    return employees.find(employee => employee.id === id);
  }
  
  async getEmployeesByManager(managerId: string): Promise<Employee[]> {
    const employees = await this.getEmployees();
    return employees.filter(employee => employee.manager === managerId);
  }
  
  async getEmployeesByDepartment(department: string): Promise<Employee[]> {
    const employees = await this.getEmployees();
    return employees.filter(employee => employee.department === department);
  }
  
  // Shift data methods
  async getShifts(): Promise<Shift[]> {
    const data = await this.loadData<Shifts>('shifts.json');
    return data.shifts;
  }
  
  async getShiftsByEmployeeId(employeeId: string): Promise<Shift[]> {
    const shifts = await this.getShifts();
    return shifts.filter(shift => shift.employeeId === employeeId);
  }
  
  async getShiftsByDateRange(startDate: string, endDate: string): Promise<Shift[]> {
    const shifts = await this.getShifts();
    return shifts.filter(shift => 
      shift.startDate >= startDate && shift.endDate <= endDate
    );
  }
  
  // Employee task methods
  async getEmployeeTasks(): Promise<EmployeeTask[]> {
    const data = await this.loadData<EmployeeTasks>('employee_tasks.json');
    return data.employee_tasks;
  }
  
  async getEmployeeTasksByEmployeeId(employeeId: string): Promise<EmployeeTask[]> {
    const tasks = await this.getEmployeeTasks();
    return tasks.filter(task => task.employeeId === employeeId);
  }
  
  async getEmployeeTasksByStatus(status: string): Promise<EmployeeTask[]> {
    const tasks = await this.getEmployeeTasks();
    return tasks.filter(task => task.status === status);
  }
  
  // Talent task methods
  async getTalentTasks(): Promise<TalentTask[]> {
    const data = await this.loadData<TalentTasks>('talent_tasks.json');
    return data.talent_tasks;
  }
  
  async getTalentTasksByManagerId(managerId: string): Promise<TalentTask[]> {
    const tasks = await this.getTalentTasks();
    return tasks.filter(task => task.managerId === managerId);
  }
  
  async getTalentTasksByType(taskType: string): Promise<TalentTask[]> {
    const tasks = await this.getTalentTasks();
    return tasks.filter(task => task.taskType === taskType);
  }
  
  // Recognition task methods
  async getRecognitionTasks(): Promise<RecognitionTask[]> {
    const data = await this.loadData<RecognitionTasks>('recognition_tasks.json');
    return data.recognition_tasks;
  }
  
  async getRecognitionTasksByManagerId(managerId: string): Promise<RecognitionTask[]> {
    const tasks = await this.getRecognitionTasks();
    return tasks.filter(task => task.managerId === managerId);
  }
  
  // Shift task methods
  async getShiftTasks(): Promise<ShiftTask[]> {
    const data = await this.loadData<ShiftTasks>('shift_tasks.json');
    return data.shift_tasks;
  }
  
  async getShiftTasksByManagerId(managerId: string): Promise<ShiftTask[]> {
    const tasks = await this.getShiftTasks();
    return tasks.filter(task => task.managerId === managerId);
  }
  
  // Job methods
  async getJobs(): Promise<Job[]> {
    const data = await this.loadData<Jobs>('jobs.json');
    return data.jobs;
  }
  
  async getJobById(id: string): Promise<Job | undefined> {
    const jobs = await this.getJobs();
    return jobs.find(job => job.id === id);
  }
  
  async getJobsByStatus(status: string): Promise<Job[]> {
    const jobs = await this.getJobs();
    return jobs.filter(job => job.status === status);
  }
  
  async getJobsByHiringManager(managerId: string): Promise<Job[]> {
    const jobs = await this.getJobs();
    return jobs.filter(job => job.hiringManager === managerId);
  }
  
  // Candidate methods
  async getCandidates(): Promise<Candidate[]> {
    const data = await this.loadData<Candidates>('candidates.json');
    return data.candidates;
  }
  
  async getCandidateById(id: string): Promise<Candidate | undefined> {
    const candidates = await this.getCandidates();
    return candidates.find(candidate => candidate.id === id);
  }
  
  async getCandidatesByJobId(jobId: string): Promise<Candidate[]> {
    const candidates = await this.getCandidates();
    return candidates.filter(candidate => candidate.jobId === jobId);
  }
  
  async getCandidatesByStage(stage: string): Promise<Candidate[]> {
    const candidates = await this.getCandidates();
    return candidates.filter(candidate => candidate.stage === stage);
  }
  
  // Recognition methods
  async getRecognitions(): Promise<Recognition[]> {
    const data = await this.loadData<Recognitions>('recognition.json');
    return data.recognition;
  }
  
  async getRecognitionsByEmployeeId(employeeId: string): Promise<Recognition[]> {
    const recognitions = await this.getRecognitions();
    return recognitions.filter(recognition => 
      recognition.employeeId === employeeId || 
      (recognition.members && recognition.members.includes(employeeId))
    );
  }
  
  async getRecognitionsByType(type: string): Promise<Recognition[]> {
    const recognitions = await this.getRecognitions();
    return recognitions.filter(recognition => recognition.type === type);
  }
  
  // Combined data access methods
  async getManagerDashboardData(managerId: string) {
    const employees = await this.getEmployeesByManager(managerId);
    const talentTasks = await this.getTalentTasksByManagerId(managerId);
    const recognitionTasks = await this.getRecognitionTasksByManagerId(managerId);
    const shiftTasks = await this.getShiftTasksByManagerId(managerId);
    const jobs = await this.getJobsByHiringManager(managerId);
    
    // Get candidates for manager's job postings
    const jobIds = jobs.map(job => job.id);
    const allCandidates = await this.getCandidates();
    const candidates = allCandidates.filter(candidate => 
      jobIds.includes(candidate.jobId)
    );
    
    return {
      employees,
      talentTasks,
      recognitionTasks,
      shiftTasks,
      jobs,
      candidates
    };
  }
  
  async getEmployeeProfile(employeeId: string) {
    const employee = await this.getEmployeeById(employeeId);
    if (!employee) return null;
    
    const tasks = await this.getEmployeeTasksByEmployeeId(employeeId);
    const shifts = await this.getShiftsByEmployeeId(employeeId);
    const recognitions = await this.getRecognitionsByEmployeeId(employeeId);
    
    let manager = null;
    if (employee.manager) {
      manager = await this.getEmployeeById(employee.manager);
    }
    
    let directReports = [];
    if (employee.position.includes('Manager') || employee.position.includes('Director')) {
      directReports = await this.getEmployeesByManager(employeeId);
    }
    
    return {
      employee,
      manager,
      directReports,
      tasks,
      shifts,
      recognitions
    };
  }
  
  async getJobPostingDetails(jobId: string) {
    const job = await this.getJobById(jobId);
    if (!job) return null;
    
    const candidates = await this.getCandidatesByJobId(jobId);
    const hiringManager = await this.getEmployeeById(job.hiringManager);
    
    return {
      job,
      candidates,
      hiringManager
    };
  }
}

// Export a singleton instance
const dataService = new DataService();
export default dataService;