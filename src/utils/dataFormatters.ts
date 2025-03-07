/**
 * Utility functions for formatting data for prompts and display
 */
import type {
  Employee,
  Shift,
  EmployeeTask,
  TalentTask,
  Job,
  Candidate,
  Recognition
} from '../services/dataService';

/**
 * Formats an employee for prompt inclusion
 * @param employee Employee data
 * @returns Formatted employee string
 */
export function formatEmployee(employee: Employee): string {
  return `
Name: ${employee.firstName} ${employee.lastName}
ID: ${employee.id}
Position: ${employee.position}
Department: ${employee.department}
Email: ${employee.email}
Phone: ${employee.phone}
Location: ${employee.location}
Work Type: ${employee.workType}
Status: ${employee.status}
Manager ID: ${employee.manager || 'None'}
Hire Date: ${employee.hireDate}
Skills: ${employee.skills.join(', ')}
`;
}

/**
 * Formats an employee list as a concise summary
 * @param employees Array of employees
 * @returns Formatted employee list string
 */
export function formatEmployeeList(employees: Employee[]): string {
  if (employees.length === 0) return 'No employees found.';
  
  return employees.map(employee => 
    `${employee.id}: ${employee.firstName} ${employee.lastName} - ${employee.position} (${employee.department})`
  ).join('\n');
}

/**
 * Formats a shift schedule
 * @param shift Shift data
 * @returns Formatted shift string
 */
export function formatShift(shift: Shift): string {
  const scheduleStr = shift.schedule.map(day => 
    `${day.day}: ${day.startTime} - ${day.endTime}, Break: ${day.breakTime}`
  ).join('\n');
  
  return `
Shift ID: ${shift.id}
Employee ID: ${shift.employeeId}
Date Range: ${shift.startDate} to ${shift.endDate}
Type: ${shift.type}
Status: ${shift.status}
Location: ${shift.location}
Schedule:
${scheduleStr}
`;
}

/**
 * Formats a list of shifts for a given date range
 * @param shifts Array of shifts
 * @returns Formatted shift list string
 */
export function formatShiftList(shifts: Shift[]): string {
  if (shifts.length === 0) return 'No shifts found.';
  
  return shifts.map(shift => 
    `${shift.id}: ${shift.employeeId} - ${shift.startDate} to ${shift.endDate} (${shift.status})`
  ).join('\n');
}

/**
 * Formats an employee task
 * @param task Employee task data
 * @returns Formatted task string
 */
export function formatEmployeeTask(task: EmployeeTask): string {
  return `
Task ID: ${task.id}
Title: ${task.title}
Type: ${task.taskType}
Description: ${task.description}
Status: ${task.status}
Due Date: ${task.dueDate}
${task.completedDate ? `Completed Date: ${task.completedDate}` : ''}
Priority: ${task.priority}
Assigned By: ${task.assignedBy}
Assigned Date: ${task.assignedDate}
Notes: ${task.notes}
`;
}

/**
 * Formats a talent acquisition task
 * @param task Talent task data
 * @returns Formatted task string
 */
export function formatTalentTask(task: TalentTask): string {
  return `
Task ID: ${task.id}
Title: ${task.title}
Type: ${task.taskType}
Description: ${task.description}
Status: ${task.status}
Due Date: ${task.dueDate}
${task.completedDate ? `Completed Date: ${task.completedDate}` : ''}
Priority: ${task.priority}
${task.departmentId ? `Department ID: ${task.departmentId}` : ''}
${task.candidateId ? `Candidate ID: ${task.candidateId}` : ''}
Notes: ${task.notes}
`;
}

/**
 * Formats a job posting
 * @param job Job data
 * @returns Formatted job string
 */
export function formatJob(job: Job): string {
  const requirementsStr = job.requirements.map(req => `- ${req}`).join('\n');
  
  return `
Job ID: ${job.id}
Title: ${job.title}
Department: ${job.department}
Location: ${job.location}
Work Type: ${job.workType}
Status: ${job.status}
Posting Date: ${job.postingDate}
Closing Date: ${job.closingDate}
Salary Range: ${job.salary.currency} ${job.salary.min} - ${job.salary.max}${job.salary.commission ? ` plus ${job.salary.commission} commission` : ''}
Hiring Manager: ${job.hiringManager}
Priority: ${job.priority}
Applications: ${job.applicationCount}
Interviews: ${job.interviews}

Description:
${job.description}

Requirements:
${requirementsStr}
`;
}

/**
 * Formats a list of job postings
 * @param jobs Array of jobs
 * @returns Formatted job list string
 */
export function formatJobList(jobs: Job[]): string {
  if (jobs.length === 0) return 'No jobs found.';
  
  return jobs.map(job => 
    `${job.id}: ${job.title} - ${job.department} (${job.status})`
  ).join('\n');
}

/**
 * Formats a candidate profile
 * @param candidate Candidate data
 * @returns Formatted candidate string
 */
export function formatCandidate(candidate: Candidate): string {
  let interviewStr = '';
  if (candidate.interviewFeedback && candidate.interviewFeedback.length > 0) {
    interviewStr = candidate.interviewFeedback.map(feedback => 
      `Interviewer: ${feedback.interviewerId}, Date: ${feedback.date}, Score: ${feedback.score}, Recommendation: ${feedback.recommendation}`
    ).join('\n');
  }
  
  let offerStr = '';
  if (candidate.offerDetails) {
    offerStr = `
Offer Details:
- Salary: ${candidate.offerDetails.salary}
- ${candidate.offerDetails.bonus ? `Bonus: ${candidate.offerDetails.bonus}` : ''}
- Start Date: ${candidate.offerDetails.startDate}
- Expiration: ${candidate.offerDetails.expirationDate}
`;
  }
  
  return `
Candidate ID: ${candidate.id}
Name: ${candidate.firstName} ${candidate.lastName}
Email: ${candidate.email}
Phone: ${candidate.phone}
Job ID: ${candidate.jobId}
Stage: ${candidate.stage}
Application Date: ${candidate.applicationDate}
Last Updated: ${candidate.lastUpdated}
Status: ${candidate.status}
Experience: ${candidate.experience}
Education: ${candidate.education}
Skills: ${candidate.skills.join(', ')}
${interviewStr ? `\nInterview Feedback:\n${interviewStr}` : ''}
${offerStr}
Notes: ${candidate.notes}
`;
}

/**
 * Formats a recognition entry
 * @param recognition Recognition data
 * @returns Formatted recognition string
 */
export function formatRecognition(recognition: Recognition): string {
  return `
Recognition ID: ${recognition.id}
Type: ${recognition.type}
Date: ${recognition.date}
Category: ${recognition.category}
${recognition.employeeId ? `Employee ID: ${recognition.employeeId}` : ''}
${recognition.teamId ? `Team ID: ${recognition.teamId}` : ''}
${recognition.teamName ? `Team Name: ${recognition.teamName}` : ''}
${recognition.recognizedBy ? `Recognized By: ${recognition.recognizedBy}` : ''}
Description: ${recognition.description}
Tags: ${recognition.tags.join(', ')}
`;
}

/**
 * Creates a summary of tasks for a manager
 * @param employeeTasks Employee tasks
 * @param talentTasks Talent tasks
 * @param recognitionTasks Recognition tasks
 * @param shiftTasks Shift tasks
 * @returns Summary string of pending tasks
 */
export function formatManagerTaskSummary(
  employeeTasks: EmployeeTask[],
  talentTasks: TalentTask[],
  recognitionTasks: any[],
  shiftTasks: any[]
): string {
  const pendingEmployeeTasks = employeeTasks.filter(t => t.status === 'pending' || t.status === 'in_progress');
  const pendingTalentTasks = talentTasks.filter(t => t.status === 'pending' || t.status === 'in_progress');
  const pendingRecognitionTasks = recognitionTasks.filter(t => t.status === 'pending' || t.status === 'in_progress');
  const pendingShiftTasks = shiftTasks.filter(t => t.status === 'pending' || t.status === 'in_progress');
  
  const highPriorityCount = [
    ...pendingEmployeeTasks, 
    ...pendingTalentTasks,
    ...pendingRecognitionTasks,
    ...pendingShiftTasks
  ].filter(t => t.priority === 'high').length;
  
  return `
Task Summary:
- ${pendingEmployeeTasks.length} pending employee-related tasks
- ${pendingTalentTasks.length} pending talent acquisition tasks
- ${pendingRecognitionTasks.length} pending recognition tasks
- ${pendingShiftTasks.length} pending shift management tasks
- ${highPriorityCount} high priority tasks requiring attention
`;
}

/**
 * Creates a summary of candidate pipeline for a specific job
 * @param candidates Candidates for a job
 * @returns Summary string of candidates by stage
 */
export function formatCandidatePipelineSummary(candidates: Candidate[]): string {
  const stages = ['screening', 'phone', 'assessment', 'onsite', 'offer', 'accepted', 'rejected'];
  
  const candidatesByStage = stages.reduce((acc, stage) => {
    acc[stage] = candidates.filter(c => c.stage === stage).length;
    return acc;
  }, {} as Record<string, number>);
  
  return `
Candidate Pipeline:
- Screening: ${candidatesByStage.screening || 0}
- Phone Interview: ${candidatesByStage.phone || 0}
- Assessment: ${candidatesByStage.assessment || 0}
- Onsite Interview: ${candidatesByStage.onsite || 0}
- Offer: ${candidatesByStage.offer || 0}
- Accepted: ${candidatesByStage.accepted || 0}
- Rejected: ${candidatesByStage.rejected || 0}
- Total: ${candidates.length}
`;
}

/**
 * Determines if data is related to employee assistance or talent acquisition
 * @param data Any data object to analyze
 * @returns Object with scores indicating relevance to each domain
 */
export function classifyDataDomain(data: any): { 
  employeeAssistance: number, 
  talentAcquisition: number 
} {
  // Default neutral scores
  let employeeAssistance = 0;
  let talentAcquisition = 0;
  
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
  
  // Convert data to string for analysis
  const dataString = JSON.stringify(data).toLowerCase();
  
  // Count keyword matches for each domain
  employeeKeywords.forEach(keyword => {
    const regex = new RegExp(keyword, 'gi');
    const matches = dataString.match(regex);
    if (matches) {
      employeeAssistance += matches.length;
    }
  });
  
  talentKeywords.forEach(keyword => {
    const regex = new RegExp(keyword, 'gi');
    const matches = dataString.match(regex);
    if (matches) {
      talentAcquisition += matches.length;
    }
  });
  
  // Normalize scores
  const total = employeeAssistance + talentAcquisition;
  if (total > 0) {
    employeeAssistance = employeeAssistance / total;
    talentAcquisition = talentAcquisition / total;
  } else {
    // If no keywords matched, default to equal probability
    employeeAssistance = 0.5;
    talentAcquisition = 0.5;
  }
  
  return { employeeAssistance, talentAcquisition };
}

/**
 * Extracts relevant data based on conversation context
 * @param allData All available data
 * @param query User query string
 * @returns Filtered data relevant to the query
 */
export function extractRelevantData(allData: any, query: string): any {
  const queryLower = query.toLowerCase();
  const result: any = {};
  
  // Employee-related queries
  if (queryLower.includes('employee') || 
      queryLower.includes('staff') || 
      queryLower.includes('team member')) {
    result.employees = allData.employees;
  }
  
  // Shift-related queries
  if (queryLower.includes('shift') || 
      queryLower.includes('schedule') || 
      queryLower.includes('time off') || 
      queryLower.includes('pto')) {
    result.shifts = allData.shifts;
    result.shiftTasks = allData.shiftTasks;
  }
  
  // Task-related queries
  if (queryLower.includes('task') || 
      queryLower.includes('to do') || 
      queryLower.includes('assignment')) {
    result.employeeTasks = allData.employeeTasks;
    result.talentTasks = allData.talentTasks;
    result.recognitionTasks = allData.recognitionTasks;
    result.shiftTasks = allData.shiftTasks;
  }
  
  // Recognition-related queries
  if (queryLower.includes('recognition') || 
      queryLower.includes('award') || 
      queryLower.includes('acknowledge')) {
    result.recognition = allData.recognition;
    result.recognitionTasks = allData.recognitionTasks;
  }
  
  // Job-related queries
  if (queryLower.includes('job') || 
      queryLower.includes('position') || 
      queryLower.includes('opening') || 
      queryLower.includes('vacancy')) {
    result.jobs = allData.jobs;
  }
  
  // Candidate-related queries
  if (queryLower.includes('candidate') || 
      queryLower.includes('applicant') || 
      queryLower.includes('interview') || 
      queryLower.includes('hiring')) {
    result.candidates = allData.candidates;
    result.jobs = allData.jobs;
  }
  
  // If no specific filters matched, return summary data
  if (Object.keys(result).length === 0) {
    return {
      employeeCount: allData.employees ? allData.employees.length : 0,
      openJobsCount: allData.jobs ? allData.jobs.filter((j: Job) => j.status === 'open').length : 0,
      activeTasksCount: [
        ...(allData.employeeTasks || []),
        ...(allData.talentTasks || []),
        ...(allData.recognitionTasks || []),
        ...(allData.shiftTasks || [])
      ].filter((t: any) => t.status === 'pending' || t.status === 'in_progress').length,
      activeCandidatesCount: allData.candidates ? allData.candidates.filter((c: Candidate) => c.status === 'active').length : 0
    };
  }
  
  return result;
}

export default {
  formatEmployee,
  formatEmployeeList,
  formatShift,
  formatShiftList,
  formatEmployeeTask,
  formatTalentTask,
  formatJob,
  formatJobList,
  formatCandidate,
  formatRecognition,
  formatManagerTaskSummary,
  formatCandidatePipelineSummary,
  classifyDataDomain,
  extractRelevantData
};