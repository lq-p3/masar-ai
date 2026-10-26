import { JobApplication, ApplicationStatus } from '../types';

export interface ApplicationStats {
  total: number;
  applied: number;
  underReview: number;
  shortlisted: number;
  assessment: number;
  interview: number;
  offer: number;
  rejected: number;
  appToInterviewRate: number;
  interviewToOfferRate: number;
  rejectionRate: number;
  avgMatchScore: number;
}

export function normalizeStatus(statusStr: string | undefined | null): ApplicationStatus {
  if (!statusStr) return 'Applied';
  const clean = statusStr.trim().toLowerCase().replace(/_/g, ' ');
  if (clean.includes('interview') || clean.includes('مقابلة')) return 'Interview';
  if (clean.includes('offer') || clean.includes('عرض')) return 'Offer';
  if (clean.includes('assessment') || clean.includes('اختبار')) return 'Assessment';
  if (clean.includes('shortlisted') || clean.includes('مرشح')) return 'Shortlisted';
  if (clean.includes('review') || clean.includes('مراجعة')) return 'Under Review';
  if (clean.includes('reject') || clean.includes('مرفوض')) return 'Rejected';
  return 'Applied';
}

export function calculateApplicationStats(apps: JobApplication[]): ApplicationStats {
  const total = apps.length;
  let applied = 0;
  let underReview = 0;
  let shortlisted = 0;
  let assessment = 0;
  let interview = 0;
  let offer = 0;
  let rejected = 0;

  apps.forEach(app => {
    const norm = normalizeStatus(app.status);
    switch (norm) {
      case 'Applied': applied++; break;
      case 'Under Review': underReview++; break;
      case 'Shortlisted': shortlisted++; break;
      case 'Assessment': assessment++; break;
      case 'Interview': interview++; break;
      case 'Offer': offer++; break;
      case 'Rejected': rejected++; break;
    }
  });

  const appToInterviewRate = total > 0 ? Math.round((interview / total) * 100) : 0;
  const interviewToOfferRate = interview > 0 ? Math.round((offer / interview) * 100) : 0;
  const rejectionRate = total > 0 ? Math.round((rejected / total) * 100) : 0;

  const validScores = apps.map(a => a.matchScore).filter((s): s is number => typeof s === 'number' && !isNaN(s) && s > 0);
  const avgMatchScore = validScores.length > 0
    ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length)
    : 0;

  return {
    total,
    applied,
    underReview,
    shortlisted,
    assessment,
    interview,
    offer,
    rejected,
    appToInterviewRate,
    interviewToOfferRate,
    rejectionRate,
    avgMatchScore
  };
}
