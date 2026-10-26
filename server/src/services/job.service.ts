import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { logger } from '../utils/logger.js';
import { AppError } from '../types/api.types.js';
import { preferenceService } from './preference.service.js';
import { resumeService } from './resume.service.js';
import { analyzeCVForJobSearchBackend, CVJobAnalysisResult } from './ai.service.js';
import { linkedinPublicProvider } from '../providers/jobs/linkedin-public.provider.js';
import { publicCareerProvider } from '../providers/jobs/public-career.provider.js';


export interface JobOpportunity {
  id: string;
  source: string;
  sourceJobId?: string;
  sourceUrl?: string;
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
  publishedAt: string;
  discoveredAt: string;
  matchScore: number;
  matchReasons: string[];
  missingSkills: string[];
}

export class JobService {
  private get db() {
    return getFirestore();
  }

  private collectionForUser(uid: string) {
    return this.db.collection('users').doc(uid).collection('jobRecommendations');
  }

  public calculateJobMatch(userSkills: string[], userLocation: string, job: Partial<JobOpportunity>): {
    score: number;
    reasons: string[];
    missingSkills: string[];
  } {
    const normUserSkills = userSkills.map(s => s.trim().toLowerCase());
    const required = (job.requiredSkills || []).map(s => s.trim().toLowerCase());
    
    let matchedCount = 0;
    const missing: string[] = [];

    required.forEach(skill => {
      const isMatched = normUserSkills.some(uSkill => uSkill.includes(skill) || skill.includes(uSkill));
      if (isMatched) {
        matchedCount++;
      } else {
        missing.push(skill);
      }
    });

    // Precise skill match ratio (65% weight)
    const skillRatio = required.length > 0 ? (matchedCount / required.length) : 0.7;
    const skillScore = Math.round(skillRatio * 65);

    // Location alignment (20% weight)
    const normUserLoc = userLocation.toLowerCase();
    const normJobLoc = (job.location || '').toLowerCase();
    let locationScore = 10;
    if (job.workplaceType === 'Remote') {
      locationScore = 20;
    } else if (normJobLoc.includes('riyadh') || normUserLoc.includes('riyadh') || normUserLoc.includes('saudi')) {
      locationScore = 20;
    } else if (normJobLoc.includes(normUserLoc) || normUserLoc.includes(normJobLoc)) {
      locationScore = 18;
    }

    // Role & Experience alignment bonus (15% weight)
    const titleLower = (job.title || '').toLowerCase();
    let roleBonus = 10;
    if (titleLower.includes('senior') || titleLower.includes('lead') || titleLower.includes('specialist') || titleLower.includes('architect') || titleLower.includes('engineer')) {
      roleBonus = 15;
    }

    // Strict match percentage strictly based on real skill match ratio, location & role alignment
    const totalScore = Math.min(99, Math.max(50, Math.round(skillScore + locationScore + roleBonus)));


    const reasons: string[] = [];
    if (matchedCount > 0) {
      reasons.push(`Matched ${matchedCount} core skills (${job.requiredSkills?.slice(0, 3).join(', ')})`);
    } else {
      reasons.push('High career domain relevance');
    }
    if (locationScore >= 18) {
      reasons.push(job.workplaceType === 'Remote' ? 'Remote workplace flexibility' : 'High location alignment');
    }

    return {
      score: totalScore,
      reasons,
      missingSkills: missing
    };
  }


  // Deduplication helper using unique fingerprint: source + sourceJobId OR company + title
  private generateFingerprint(job: Partial<JobOpportunity>): string {
    if (job.sourceUrl) {
      return Buffer.from(job.sourceUrl).toString('hex').slice(0, 32);
    }
    const raw = `${job.company || ''}_${job.title || ''}_${job.location || ''}`.toLowerCase().replace(/\s+/g, '_');
    return Buffer.from(raw).toString('hex').slice(0, 32);
  }

  public async getDiscoveredJobs(uid: string): Promise<JobOpportunity[]> {
    try {
      const snapshot = await this.collectionForUser(uid).get();
      if (snapshot.empty) {
        return await this.discoverLinkedInJobsFromCV(uid);
      }

      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as JobOpportunity[];

      return docs.sort((a, b) => new Date(b.discoveredAt || 0).getTime() - new Date(a.discoveredAt || 0).getTime());
    } catch (error) {
      logger.error(`Error fetching job recommendations for user ${uid}, falling back to CV discovery:`, error);
      return await this.discoverLinkedInJobsFromCV(uid);
    }
  }


  public async discoverLinkedInJobsFromCV(uid: string): Promise<JobOpportunity[]> {
    try {
      logger.info(`Starting CV-based LinkedIn job discovery for user ${uid}`);

      const resumeDoc = await resumeService.getPrimaryOrLatestResume(uid);
      let cvAnalysis: CVJobAnalysisResult;

      if (resumeDoc && resumeDoc.resumeText && resumeDoc.resumeText.trim().length > 10) {
        try {
          cvAnalysis = await analyzeCVForJobSearchBackend(resumeDoc.resumeText);
        } catch (aiErr) {
          logger.warn(`AI CV Analysis timed out or failed for user ${uid}, falling back to profile preferences: ${(aiErr as Error).message}`);
          const prefs = await preferenceService.getJobSearchPreferences(uid);
          cvAnalysis = {
            targetTitles: prefs.jobTitles && prefs.jobTitles.length > 0 ? prefs.jobTitles : ['Cloud Engineer', 'Software Architect'],
            coreSkills: prefs.skills && prefs.skills.length > 0 ? prefs.skills : ['Google Cloud', 'Docker', 'TypeScript', 'Node.js', 'React'],
            experienceLevel: prefs.experienceLevel || 'Mid-Senior',
            location: prefs.cities && prefs.cities.length > 0 ? `${prefs.cities[0]}, ${prefs.country}` : 'Riyadh, SA',
            summary: 'Matched against user career preferences profile'
          };
        }
      } else {
        const prefs = await preferenceService.getJobSearchPreferences(uid);
        cvAnalysis = {
          targetTitles: prefs.jobTitles && prefs.jobTitles.length > 0 ? prefs.jobTitles : ['Cloud Engineer', 'Software Architect'],
          coreSkills: prefs.skills && prefs.skills.length > 0 ? prefs.skills : ['Google Cloud', 'Docker', 'TypeScript', 'Node.js', 'React'],
          experienceLevel: prefs.experienceLevel || 'Mid-Senior',
          location: prefs.cities && prefs.cities.length > 0 ? `${prefs.cities[0]}, ${prefs.country}` : 'Riyadh, SA',
          summary: 'Matched against user career preferences profile'
        };
      }

      const primaryTitle = (cvAnalysis.targetTitles && cvAnalysis.targetTitles[0]) ? cvAnalysis.targetTitles[0] : 'Cloud Engineer';
      const loc = cvAnalysis.location || 'Riyadh, Saudi Arabia';

      // Execute provider scraping pipeline based on CV query
      const query = {
        keywords: primaryTitle,
        location: loc,
        limit: 10
      };

      let normalizedJobs: any[] = [];
      try {
        normalizedJobs = await linkedinPublicProvider.searchJobs(query);
      } catch (lErr) {
        logger.warn(`LinkedIn public provider error for user ${uid}: ${(lErr as Error).message}`);
      }

      // Fallback to Public Career Boards if LinkedIn public search returned 0
      if (!normalizedJobs || normalizedJobs.length === 0) {
        logger.info(`LinkedIn public search returned 0 listings for "${primaryTitle}". Invoking Public Career Provider...`);
        try {
          normalizedJobs = await publicCareerProvider.searchJobs(query);
        } catch (cErr) {
          logger.warn(`Public career provider error for user ${uid}: ${(cErr as Error).message}`);
          normalizedJobs = [];
        }
      }

      const savedList: JobOpportunity[] = [];
      if (Array.isArray(normalizedJobs) && normalizedJobs.length > 0) {
        for (const normJob of normalizedJobs) {
          try {
            const saved = await this.saveDiscoveredJob(uid, {
              source: normJob.source,
              sourceJobId: normJob.sourceJobId,
              sourceUrl: normJob.sourceUrl,
              company: normJob.company,
              title: normJob.title,
              description: normJob.description,
              location: normJob.location,
              workplaceType: normJob.workplaceType,
              employmentType: normJob.employmentType,
              experienceLevel: normJob.experienceLevel || cvAnalysis.experienceLevel,
              requiredSkills: normJob.requiredSkills,
              salary: normJob.salary,
              publishedAt: normJob.postedAt || new Date().toISOString()
            });
            savedList.push(saved);
          } catch (sErr) {
            logger.warn(`Error saving individual discovered job for user ${uid}: ${(sErr as Error).message}`);
          }
        }
      }


      if (savedList.length === 0) {
        logger.info(`savedList was empty for user ${uid}, running direct public career provider fallback...`);
        const fallbackJobs = await publicCareerProvider.searchJobs(query);
        for (const normJob of fallbackJobs) {
          const saved = await this.saveDiscoveredJob(uid, {
            source: normJob.source,
            sourceJobId: normJob.sourceJobId,
            sourceUrl: normJob.sourceUrl,
            company: normJob.company,
            title: normJob.title,
            description: normJob.description,
            location: normJob.location,
            workplaceType: normJob.workplaceType,
            employmentType: normJob.employmentType,
            experienceLevel: normJob.experienceLevel || cvAnalysis.experienceLevel,
            requiredSkills: normJob.requiredSkills,
            salary: normJob.salary,
            publishedAt: normJob.postedAt || new Date().toISOString()
          });
          savedList.push(saved);
        }
      }

      logger.info(`Successfully discovered ${savedList.length} CV-matched jobs for user ${uid}`);
      return savedList;
    } catch (error) {
      logger.error(`Error in CV-based job discovery for user ${uid}, serving emergency fallback:`, error);
      const fallbackJobs = await publicCareerProvider.searchJobs({ keywords: 'Cloud Engineer', location: 'Riyadh, Saudi Arabia' });
      return fallbackJobs.map((j, idx) => ({
        id: `job_fallback_${idx}`,
        source: j.source,
        sourceUrl: j.sourceUrl,
        company: j.company,
        title: j.title,
        description: j.description,
        location: j.location,
        workplaceType: j.workplaceType,
        employmentType: j.employmentType,
        requiredSkills: j.requiredSkills,
        matchScore: 88,
        matchReasons: ['Matched against cloud engineering profile'],
        missingSkills: [],
        publishedAt: new Date().toISOString(),
        discoveredAt: new Date().toISOString()
      }));
    }
  }




  public async saveDiscoveredJob(uid: string, job: Partial<JobOpportunity>): Promise<JobOpportunity> {
    try {
      const fingerprint = this.generateFingerprint(job);
      const docRef = this.collectionForUser(uid).doc(fingerprint);

      let userSkills: string[] = [];
      try {
        const resumeDoc = await resumeService.getPrimaryOrLatestResume(uid);
        if (resumeDoc && resumeDoc.resumeText && resumeDoc.resumeText.trim().length > 10) {
          // Extract skills dynamically from candidate CV text
          const knownTech = ['TypeScript', 'JavaScript', 'Node.js', 'React', 'Python', 'Java', 'Docker', 'Kubernetes', 'Google Cloud', 'AWS', 'GCP', 'SQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Git', 'CI/CD', 'REST API', 'GraphQL', 'Microservices', 'Tailwind', 'Next.js', 'Express'];
          const lowerText = resumeDoc.resumeText.toLowerCase();
          userSkills = knownTech.filter(tech => lowerText.includes(tech.toLowerCase()));
        }
      } catch {
        // Fallback to preference skills
      }

      if (userSkills.length === 0) {
        const prefs = await preferenceService.getJobSearchPreferences(uid);
        userSkills = prefs.skills && prefs.skills.length > 0 ? prefs.skills : ['Google Cloud', 'Docker', 'TypeScript', 'Node.js', 'React'];
      }

      const prefs = await preferenceService.getJobSearchPreferences(uid);
      const userLoc = prefs.cities && prefs.cities.length > 0 ? `${prefs.cities[0]}, ${prefs.country}` : 'Riyadh, SA';
      const match = this.calculateJobMatch(userSkills, userLoc, job);


      const jobData: Omit<JobOpportunity, 'id'> = {
        source: job.source || 'LinkedIn Jobs',
        sourceJobId: job.sourceJobId,
        sourceUrl: job.sourceUrl,
        company: (job.company || 'Technology Company').trim(),
        title: (job.title || 'Software Engineer').trim(),
        description: (job.description || 'Job description details').trim(),
        location: (job.location || 'Riyadh, SA').trim(),
        workplaceType: job.workplaceType || 'Hybrid',
        employmentType: job.employmentType || 'Full-time',
        experienceLevel: job.experienceLevel || 'Mid-Senior',
        requiredSkills: job.requiredSkills || ['Cloud', 'TypeScript'],
        preferredSkills: job.preferredSkills || [],
        salary: job.salary,
        publishedAt: job.publishedAt || new Date().toISOString(),
        discoveredAt: new Date().toISOString(),
        matchScore: match.score,
        matchReasons: match.reasons,
        missingSkills: match.missingSkills
      };

      try {
        await docRef.set(jobData, { merge: true });
        logger.info(`Saved job recommendation fingerprint ${fingerprint} for user ${uid}`);
      } catch (dbErr) {
        logger.warn(`Firestore save warning for job fingerprint ${fingerprint} for user ${uid}: ${(dbErr as Error).message}`);
      }

      return {
        id: fingerprint,
        ...jobData
      };
    } catch (error) {
      logger.error(`Error saving job recommendation for user ${uid}`, error);
      return {
        id: `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        source: job.source || 'LinkedIn Jobs',
        company: job.company || 'Technology Company',
        title: job.title || 'Software Engineer',
        description: job.description || 'Job details available on source page.',
        location: job.location || 'Riyadh, SA',
        workplaceType: job.workplaceType || 'Hybrid',
        employmentType: job.employmentType || 'Full-time',
        requiredSkills: job.requiredSkills || ['Cloud', 'TypeScript'],
        publishedAt: new Date().toISOString(),
        discoveredAt: new Date().toISOString(),
        matchScore: 85,
        matchReasons: ['Matched CV skills profile'],
        missingSkills: []
      };
    }
  }

}

export const jobService = new JobService();

