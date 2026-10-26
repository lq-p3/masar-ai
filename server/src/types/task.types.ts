export interface TaskDoc {
  id: string;
  userId: string;
  text: string;
  dueDate: string;
  completed: boolean;
  urgent?: boolean;
  company?: string;
  applicationId?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateTaskDTO {
  text: string;
  dueDate?: string;
  urgent?: boolean;
  company?: string;
  applicationId?: string;
}

export interface UpdateTaskDTO {
  text?: string;
  dueDate?: string;
  completed?: boolean;
  urgent?: boolean;
  company?: string;
  applicationId?: string;
}
