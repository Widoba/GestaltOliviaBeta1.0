import { Tool, ToolCall } from './anthropicService';
import dataService from './dataService';

/**
 * Service for handling function calling with Claude
 * Defines available tools and executes tool calls
 */
class FunctionCallingService {
  /**
   * Get all available tools that can be used by Claude
   * @returns Array of tools with schemas
   */
  getAvailableTools(): Tool[] {
    return [
      this.getEmployeeDataTool(),
      this.getEmployeeTasksTool(),
      this.getShiftDataTool(),
      this.getJobDataTool(),
      this.getCandidateDataTool(),
      this.getRecognitionDataTool(),
      this.completeTaskTool(),
      this.approveShiftSwapTool(),
      this.recognizeEmployeeTool(),
      this.scheduleInterviewTool()
    ];
  }

  /**
   * Execute a specific tool call based on the name and inputs
   * @param toolCall The tool call to execute
   * @returns Result of the tool execution
   */
  async executeToolCall(toolCall: ToolCall): Promise<any> {
    try {
      switch (toolCall.name) {
        case 'getEmployeeData':
          return await this.executeGetEmployeeData(toolCall.input);
        case 'getEmployeeTasks':
          return await this.executeGetEmployeeTasks(toolCall.input);
        case 'getShiftData':
          return await this.executeGetShiftData(toolCall.input);
        case 'getJobData':
          return await this.executeGetJobData(toolCall.input);
        case 'getCandidateData':
          return await this.executeGetCandidateData(toolCall.input);
        case 'getRecognitionData':
          return await this.executeGetRecognitionData(toolCall.input);
        case 'completeTask':
          return await this.executeCompleteTask(toolCall.input);
        case 'approveShiftSwap':
          return await this.executeApproveShiftSwap(toolCall.input);
        case 'recognizeEmployee':
          return await this.executeRecognizeEmployee(toolCall.input);
        case 'scheduleInterview':
          return await this.executeScheduleInterview(toolCall.input);
        default:
          throw new Error(`Unknown tool: ${toolCall.name}`);
      }
    } catch (error) {
      console.error(`Error executing tool call ${toolCall.name}:`, error);
      return {
        error: true,
        message: `Failed to execute ${toolCall.name}: ${(error as Error).message}`
      };
    }
  }

  /**
   * Execute multiple tool calls in sequence
   * @param toolCalls Array of tool calls to execute
   * @returns Array of results from each tool call
   */
  async executeToolCalls(toolCalls: ToolCall[]): Promise<any[]> {
    const results = [];
    for (const toolCall of toolCalls) {
      const result = await this.executeToolCall(toolCall);
      results.push({
        tool_call_id: toolCall.id,
        result
      });
    }
    return results;
  }

  // ===== Tool Definitions =====

  /**
   * Tool for retrieving employee data
   */
  private getEmployeeDataTool(): Tool {
    return {
      name: 'getEmployeeData',
      description: 'Get information about employees such as contact details, department, role, etc.',
      input_schema: {
        type: 'object',
        properties: {
          employeeId: {
            type: 'string',
            description: 'ID of the employee to get data for (optional)',
          },
          managerId: {
            type: 'string',
            description: 'ID of the manager to get direct reports for (optional)',
          },
          department: {
            type: 'string',
            description: 'Department to filter employees by (optional)',
          },
          limit: {
            type: 'number',
            description: 'Maximum number of employees to return (default: 10)',
          }
        },
        required: []
      }
    };
  }

  /**
   * Tool for retrieving employee tasks
   */
  private getEmployeeTasksTool(): Tool {
    return {
      name: 'getEmployeeTasks',
      description: 'Get information about tasks assigned to employees',
      input_schema: {
        type: 'object',
        properties: {
          employeeId: {
            type: 'string',
            description: 'ID of the employee to get tasks for (optional)',
          },
          status: {
            type: 'string',
            description: 'Status to filter tasks by (e.g., pending, completed) (optional)',
          },
          taskType: {
            type: 'string',
            description: 'Type of task to filter by (optional)',
          },
          limit: {
            type: 'number',
            description: 'Maximum number of tasks to return (default: 10)',
          }
        },
        required: []
      }
    };
  }

  /**
   * Tool for retrieving shift/schedule data
   */
  private getShiftDataTool(): Tool {
    return {
      name: 'getShiftData',
      description: 'Get information about employee shifts and schedules',
      input_schema: {
        type: 'object',
        properties: {
          employeeId: {
            type: 'string',
            description: 'ID of the employee to get shifts for (optional)',
          },
          startDate: {
            type: 'string',
            description: 'Start date to filter shifts by (YYYY-MM-DD) (optional)',
          },
          endDate: {
            type: 'string',
            description: 'End date to filter shifts by (YYYY-MM-DD) (optional)',
          },
          limit: {
            type: 'number',
            description: 'Maximum number of shifts to return (default: 10)',
          }
        },
        required: []
      }
    };
  }

  /**
   * Tool for retrieving job posting data
   */
  private getJobDataTool(): Tool {
    return {
      name: 'getJobData',
      description: 'Get information about job postings',
      input_schema: {
        type: 'object',
        properties: {
          jobId: {
            type: 'string',
            description: 'ID of the job to get data for (optional)',
          },
          hiringManagerId: {
            type: 'string',
            description: 'ID of the hiring manager to get jobs for (optional)',
          },
          status: {
            type: 'string',
            description: 'Status to filter jobs by (optional)',
          },
          limit: {
            type: 'number',
            description: 'Maximum number of jobs to return (default: 10)',
          }
        },
        required: []
      }
    };
  }

  /**
   * Tool for retrieving candidate data
   */
  private getCandidateDataTool(): Tool {
    return {
      name: 'getCandidateData',
      description: 'Get information about job candidates',
      input_schema: {
        type: 'object',
        properties: {
          candidateId: {
            type: 'string',
            description: 'ID of the candidate to get data for (optional)',
          },
          jobId: {
            type: 'string',
            description: 'Job ID to filter candidates by (optional)',
          },
          stage: {
            type: 'string',
            description: 'Stage in hiring process to filter by (optional)',
          },
          limit: {
            type: 'number',
            description: 'Maximum number of candidates to return (default: 10)',
          }
        },
        required: []
      }
    };
  }

  /**
   * Tool for retrieving recognition data
   */
  private getRecognitionDataTool(): Tool {
    return {
      name: 'getRecognitionData',
      description: 'Get information about employee recognitions',
      input_schema: {
        type: 'object',
        properties: {
          employeeId: {
            type: 'string',
            description: 'ID of the employee to get recognitions for (optional)',
          },
          type: {
            type: 'string',
            description: 'Type of recognition to filter by (optional)',
          },
          limit: {
            type: 'number',
            description: 'Maximum number of recognitions to return (default: 10)',
          }
        },
        required: []
      }
    };
  }

  /**
   * Tool for marking a task as complete
   */
  private completeTaskTool(): Tool {
    return {
      name: 'completeTask',
      description: 'Mark a task as completed',
      input_schema: {
        type: 'object',
        properties: {
          taskId: {
            type: 'string',
            description: 'ID of the task to complete',
          },
          notes: {
            type: 'string',
            description: 'Optional notes about task completion',
          }
        },
        required: ['taskId']
      }
    };
  }

  /**
   * Tool for approving a shift swap request
   */
  private approveShiftSwapTool(): Tool {
    return {
      name: 'approveShiftSwap',
      description: 'Approve or deny a shift swap request',
      input_schema: {
        type: 'object',
        properties: {
          taskId: {
            type: 'string',
            description: 'ID of the shift swap task',
          },
          approved: {
            type: 'boolean',
            description: 'Whether to approve or deny the swap',
          },
          notes: {
            type: 'string',
            description: 'Optional notes about the decision',
          }
        },
        required: ['taskId', 'approved']
      }
    };
  }

  /**
   * Tool for recognizing an employee
   */
  private recognizeEmployeeTool(): Tool {
    return {
      name: 'recognizeEmployee',
      description: 'Recognize an employee for their achievements',
      input_schema: {
        type: 'object',
        properties: {
          employeeId: {
            type: 'string',
            description: 'ID of the employee to recognize',
          },
          category: {
            type: 'string',
            description: 'Category of recognition (e.g., leadership, customer_service)',
          },
          message: {
            type: 'string',
            description: 'Recognition message',
          },
          points: {
            type: 'number',
            description: 'Points to award (optional)',
          }
        },
        required: ['employeeId', 'category', 'message']
      }
    };
  }

  /**
   * Tool for scheduling an interview with a candidate
   */
  private scheduleInterviewTool(): Tool {
    return {
      name: 'scheduleInterview',
      description: 'Schedule an interview with a candidate',
      input_schema: {
        type: 'object',
        properties: {
          candidateId: {
            type: 'string',
            description: 'ID of the candidate',
          },
          date: {
            type: 'string',
            description: 'Date and time for the interview (ISO format)',
          },
          interviewerId: {
            type: 'string',
            description: 'ID of the interviewer',
          },
          location: {
            type: 'string',
            description: 'Interview location or video call link',
          },
          notes: {
            type: 'string',
            description: 'Additional notes for the interview',
          }
        },
        required: ['candidateId', 'date', 'interviewerId']
      }
    };
  }

  // ===== Tool Execution Methods =====

  /**
   * Execute getEmployeeData tool
   */
  private async executeGetEmployeeData(input: any): Promise<any> {
    try {
      let employees;

      if (input.employeeId) {
        const employee = await dataService.getEmployeeById(input.employeeId);
        return { employee };
      } else if (input.managerId) {
        employees = await dataService.getEmployeesByManager(input.managerId);
      } else if (input.department) {
        employees = await dataService.getEmployeesByDepartment(input.department);
      } else {
        employees = await dataService.getEmployees();
      }

      const limit = input.limit || 10;
      return { employees: employees.slice(0, limit) };
    } catch (error) {
      console.error('Error executing getEmployeeData:', error);
      throw error;
    }
  }

  /**
   * Execute getEmployeeTasks tool
   */
  private async executeGetEmployeeTasks(input: any): Promise<any> {
    try {
      let tasks;

      if (input.employeeId) {
        tasks = await dataService.getEmployeeTasksByEmployeeId(input.employeeId);
      } else {
        tasks = await dataService.getEmployeeTasks();
      }

      // Apply filters if provided
      if (input.status) {
        tasks = tasks.filter(task => task.status === input.status);
      }

      if (input.taskType) {
        tasks = tasks.filter(task => task.taskType === input.taskType);
      }

      const limit = input.limit || 10;
      return { tasks: tasks.slice(0, limit) };
    } catch (error) {
      console.error('Error executing getEmployeeTasks:', error);
      throw error;
    }
  }

  /**
   * Execute getShiftData tool
   */
  private async executeGetShiftData(input: any): Promise<any> {
    try {
      let shifts;

      if (input.employeeId) {
        shifts = await dataService.getShiftsByEmployeeId(input.employeeId);
      } else if (input.startDate && input.endDate) {
        shifts = await dataService.getShiftsByDateRange(input.startDate, input.endDate);
      } else {
        shifts = await dataService.getShifts();
      }

      const limit = input.limit || 10;
      return { shifts: shifts.slice(0, limit) };
    } catch (error) {
      console.error('Error executing getShiftData:', error);
      throw error;
    }
  }

  /**
   * Execute getJobData tool
   */
  private async executeGetJobData(input: any): Promise<any> {
    try {
      let jobs;

      if (input.jobId) {
        const job = await dataService.getJobById(input.jobId);
        return { job };
      } else if (input.hiringManagerId) {
        jobs = await dataService.getJobsByHiringManager(input.hiringManagerId);
      } else if (input.status) {
        jobs = await dataService.getJobsByStatus(input.status);
      } else {
        jobs = await dataService.getJobs();
      }

      const limit = input.limit || 10;
      return { jobs: jobs.slice(0, limit) };
    } catch (error) {
      console.error('Error executing getJobData:', error);
      throw error;
    }
  }

  /**
   * Execute getCandidateData tool
   */
  private async executeGetCandidateData(input: any): Promise<any> {
    try {
      let candidates;

      if (input.candidateId) {
        const candidate = await dataService.getCandidateById(input.candidateId);
        return { candidate };
      } else if (input.jobId) {
        candidates = await dataService.getCandidatesByJobId(input.jobId);
      } else if (input.stage) {
        candidates = await dataService.getCandidatesByStage(input.stage);
      } else {
        candidates = await dataService.getCandidates();
      }

      const limit = input.limit || 10;
      return { candidates: candidates.slice(0, limit) };
    } catch (error) {
      console.error('Error executing getCandidateData:', error);
      throw error;
    }
  }

  /**
   * Execute getRecognitionData tool
   */
  private async executeGetRecognitionData(input: any): Promise<any> {
    try {
      let recognitions;

      if (input.employeeId) {
        recognitions = await dataService.getRecognitionsByEmployeeId(input.employeeId);
      } else if (input.type) {
        recognitions = await dataService.getRecognitionsByType(input.type);
      } else {
        recognitions = await dataService.getRecognitions();
      }

      const limit = input.limit || 10;
      return { recognitions: recognitions.slice(0, limit) };
    } catch (error) {
      console.error('Error executing getRecognitionData:', error);
      throw error;
    }
  }

  /**
   * Execute completeTask tool
   * This would normally update a database, but for the prototype we'll simulate it
   */
  private async executeCompleteTask(input: any): Promise<any> {
    try {
      const { taskId, notes } = input;
      
      // In a real implementation, this would update the database
      // For our prototype, we'll return a success response
      return {
        success: true,
        taskId,
        message: `Task ${taskId} marked as complete${notes ? ` with notes: ${notes}` : ''}`,
        completedDate: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error executing completeTask:', error);
      throw error;
    }
  }

  /**
   * Execute approveShiftSwap tool
   */
  private async executeApproveShiftSwap(input: any): Promise<any> {
    try {
      const { taskId, approved, notes } = input;
      
      // In a real implementation, this would update the database
      return {
        success: true,
        taskId,
        approved,
        message: `Shift swap request ${approved ? 'approved' : 'denied'}${notes ? ` with notes: ${notes}` : ''}`,
        processedDate: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error executing approveShiftSwap:', error);
      throw error;
    }
  }

  /**
   * Execute recognizeEmployee tool
   */
  private async executeRecognizeEmployee(input: any): Promise<any> {
    try {
      const { employeeId, category, message, points } = input;
      
      // In a real implementation, this would create a new recognition
      return {
        success: true,
        recognitionId: `R${Date.now().toString().slice(-6)}`,
        employeeId,
        category,
        message,
        points: points || 0,
        date: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error executing recognizeEmployee:', error);
      throw error;
    }
  }

  /**
   * Execute scheduleInterview tool
   */
  private async executeScheduleInterview(input: any): Promise<any> {
    try {
      const { candidateId, date, interviewerId, location, notes } = input;
      
      // In a real implementation, this would create an interview
      return {
        success: true,
        interviewId: `I${Date.now().toString().slice(-6)}`,
        candidateId,
        interviewerId,
        date,
        location: location || 'Video call',
        notes: notes || '',
        scheduledDate: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error executing scheduleInterview:', error);
      throw error;
    }
  }
}

// Export a singleton instance
const functionCallingService = new FunctionCallingService();
export default functionCallingService;