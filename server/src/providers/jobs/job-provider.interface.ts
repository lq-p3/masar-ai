export interface JobSearchQuery {
  keywords: string;
  location: string;
  limit?: number;
}

export interface NormalizedJob {
  source: string;
  sourceJobId?: string;
  sourceUrl: string;
  company: string;
  title: string;
  description: string;
  location: string;
  workplaceType: 'Onsite' | 'Hybrid' | 'Remote';
  employmentType: 'Full-time' | 'Part-time' | 'Contract';
  experienceLevel?: string;
  requiredSkills: string[];
  preferredSkills?: string[];
  salary?: string;
  postedAt?: string;
  scrapedAt: string;
}

export interface JobProvider {
  name: string;
  searchJobs(query: JobSearchQuery): Promise<NormalizedJob[]>;
}

export type IJobProvider = JobProvider;
export type ExternalJobQuery = JobSearchQuery;
export type ExternalJobOpportunity = NormalizedJob;

