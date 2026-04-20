export type UserRole = 'developer' | 'client';
export type TaskStatus = 'todo' | 'in-progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskSource = 'client' | 'call' | 'slack' | 'internal';

export interface IUser {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  company?: string;
  avatar?: string;
  clientToken?: string;
  clientTokenActive?: boolean;
  clientTokenGeneratedAt?: string;
  createdAt: string;
}

export interface ILink {
  title: string;
  url: string;
}

export type PaymentStatus = 'pending' | 'paid';

export interface ITask {
  _id: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  budgetHours: number;
  estimatedHours?: number;
  clientId: IUser | string;
  createdBy: IUser | string;
  source: TaskSource;
  isBillable: boolean;
  links: ILink[];
  attachments: string[];
  totalLoggedHours: number;
  paymentStatus: PaymentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ITimeLog {
  _id: string;
  taskId: ITask | string;
  developerId: IUser | string;
  hours: number;
  note: string;
  date: string;
  isRunning: boolean;
  startTime?: string;
  createdAt: string;
}

export interface IComment {
  _id: string;
  taskId: string;
  userId: IUser | string;
  content: string;
  createdAt: string;
}

export interface IActivityLog {
  _id: string;
  userId: IUser | string;
  action: string;
  entityType: 'task' | 'timeLog' | 'client' | 'comment';
  entityId: string;
  details?: string;
  createdAt: string;
}

export interface IReportTask {
  task: ITask;
  logs: ITimeLog[];
  totalHours: number;
}

export interface IReport {
  client: IUser;
  developer: IUser;
  dateRange: { from: string; to: string };
  tasks: IReportTask[];
  summary: {
    totalHours: number;
    totalTasks: number;
    billableHours: number;
    nonBillableHours: number;
  };
}

export interface IDashboardStats {
  totalClients?: number;
  totalTasks: number;
  totalHoursThisWeek: number;
  totalHoursAllTime: number;
  billableHours: number;
  nonBillableHours: number;
  overBudgetTasks: number;
  tasksByStatus: { todo: number; inProgress: number; done: number };
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  total?: number;
}
