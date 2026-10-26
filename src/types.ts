export type ApplicationStatus = 
  | 'Saved'
  | 'Applied'
  | 'Under Review'
  | 'Shortlisted'
  | 'Assessment'
  | 'Interview'
  | 'Offer'
  | 'Rejected';

export type JobApplication = {
  id: string;
  company: string;
  logoUrl?: string;
  title: string;
  location: string;
  status: ApplicationStatus;
  dateApplied: string;
  lastUpdate: string;
  matchScore: number;
  source: string;
  salary?: string;
  notes?: string;
};

export type EmailCategory = 
  | 'Application Confirmation'
  | 'Under Review'
  | 'Interview'
  | 'Assessment'
  | 'Documents Required'
  | 'Offer'
  | 'Rejection'
  | 'Job Alert';

export type RecruitmentEmail = {
  id: string;
  sender: string;
  company: string;
  jobTitle: string;
  category: EmailCategory;
  summary: string;
  date: string;
  confidenceScore: number;
  actionRequired: boolean;
  actionText?: string;
};

export type ActionTask = {
  id: string;
  text: string;
  dueDate: string;
  completed: boolean;
  urgent?: boolean;
  company?: string;
};

export type Language = 'en' | 'ar';
