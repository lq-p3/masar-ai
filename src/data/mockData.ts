import { JobApplication, RecruitmentEmail } from '../types';

export const mockApplications: JobApplication[] = [
  {
    id: '1',
    company: 'STC',
    title: 'Cloud Engineer',
    location: 'Riyadh, SA',
    status: 'Interview',
    dateApplied: '2023-08-01T10:00:00Z',
    lastUpdate: '2 hours ago',
    matchScore: 89,
    source: 'LinkedIn'
  },
  {
    id: '2',
    company: 'Elm',
    title: 'Backend Developer',
    location: 'Riyadh, SA',
    status: 'Under Review',
    dateApplied: '2023-08-05T14:30:00Z',
    lastUpdate: '1 day ago',
    matchScore: 92,
    source: 'Company Site'
  },
  {
    id: '3',
    company: 'Aramco',
    title: 'DevOps Engineer',
    location: 'Dhahran, SA',
    status: 'Assessment',
    dateApplied: '2023-08-03T09:15:00Z',
    lastUpdate: '3 days ago',
    matchScore: 85,
    source: 'Indeed'
  },
  {
    id: '4',
    company: 'Microsoft',
    title: 'Cloud Solutions Architect',
    location: 'Dubai, UAE',
    status: 'Offer',
    dateApplied: '2023-07-15T11:20:00Z',
    lastUpdate: '1 week ago',
    matchScore: 95,
    source: 'Referral'
  },
  {
    id: '5',
    company: 'Company X',
    title: 'Software Engineer',
    location: 'Remote',
    status: 'Rejected',
    dateApplied: '2023-07-20T16:45:00Z',
    lastUpdate: '2 weeks ago',
    matchScore: 78,
    source: 'LinkedIn'
  },
];

export const mockEmails: RecruitmentEmail[] = [];

