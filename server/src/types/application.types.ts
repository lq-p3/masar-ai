import { Timestamp } from '@google-cloud/firestore';

export type ApplicationStatus = 
  | 'Applied'
  | 'Under Review'
  | 'Assessment'
  | 'Interview'
  | 'Offer'
  | 'Rejected'
  | 'Withdrawn';

export interface JobApplicationDoc {
  id: string; // Firestore Document ID
  company: string;
  position: string;
  location?: string;
  status: ApplicationStatus | string;
  source?: string;
  matchScore?: number;
  notes?: string;
  jobUrl?: string;
  salary?: string;
  deadline?: string;
  resumeId?: string;
  userId?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface GetApplicationsQueryDTO {
  status?: string;
  company?: string;
  source?: string;
  limit?: number;
}

export interface CreateApplicationDTO {
  company: string;
  position: string;
  location?: string;
  status?: ApplicationStatus | string;
  source?: string;
  matchScore?: number;
  notes?: string;
  jobUrl?: string;
  salary?: string;
  deadline?: string;
}

export interface UpdateApplicationDTO {
  company?: string;
  position?: string;
  location?: string;
  status?: ApplicationStatus | string;
  source?: string;
  matchScore?: number;
  notes?: string;
  jobUrl?: string;
  salary?: string;
  deadline?: string;
}
