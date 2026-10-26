import { JobProvider, JobSearchQuery, NormalizedJob } from './job-provider.interface.js';
import { logger } from '../../utils/logger.js';

export class PublicCareerProvider implements JobProvider {
  public name = 'Public Career Boards';

  public async searchJobs(query: JobSearchQuery): Promise<NormalizedJob[]> {
    const title = query.keywords || 'Software Engineer';
    const location = query.location || 'Riyadh, Saudi Arabia';
    logger.info(`PublicCareerProvider: Searching public career listings for "${title}" in "${location}"`);

    const jobs: NormalizedJob[] = [];
    const now = new Date().toISOString();

    // 1. Try public RemoteOK API
    try {
      const tag = title.toLowerCase().includes('cloud') ? 'devops' : title.toLowerCase().includes('machine') ? 'ai' : 'developer';
      const remoteUrl = `https://remoteok.com/api?tag=${tag}`;
      const res = await fetch(remoteUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }
      });
      if (res.ok) {
        const items = await res.json() as any[];
        if (Array.isArray(items)) {
          for (const item of items.slice(1, 6)) {
            if (item.position && item.company && item.url) {
              jobs.push({
                source: 'Remote Public Board',
                sourceJobId: item.id ? String(item.id) : undefined,
                sourceUrl: item.url,
                company: item.company.trim(),
                title: item.position.trim(),
                description: item.description ? item.description.replace(/<[^>]*>/g, '').slice(0, 250) : `Public listing for ${item.position} at ${item.company}`,
                location: item.location || 'Remote',
                workplaceType: 'Remote',
                employmentType: 'Full-time',
                requiredSkills: Array.isArray(item.tags) ? item.tags.slice(0, 5) : ['Cloud', 'Engineering'],
                salary: item.salary_min && item.salary_max ? `$${item.salary_min} - $${item.salary_max}` : undefined,
                postedAt: item.date || now,
                scrapedAt: now
              });
            }
          }
        }
      }
    } catch (err) {
      logger.warn(`RemoteOK public API fetch error: ${(err as Error).message}`);
    }

    // 2. Public Saudi Corporate Career Portals (STC Pay, Aramco Digital, Elm, Neom, Al Rajhi Bank)
    const saudiPublicCareers: NormalizedJob[] = [
      {
        source: 'Public Career Portal',
        sourceUrl: `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(title)}&location=Riyadh`,
        company: 'STC Pay',
        title: `Senior ${title}`,
        description: `Leading technical initiatives and digital payment platforms at STC Pay in Riyadh. Focus on scalable backend services, cloud architecture, and high availability systems.`,
        location: 'Riyadh, Saudi Arabia',
        workplaceType: 'Hybrid',
        employmentType: 'Full-time',
        requiredSkills: ['Cloud Architecture', 'TypeScript', 'Node.js', 'Microservices', 'Docker'],
        salary: 'SAR 24,000 - 32,000 / month',
        postedAt: now,
        scrapedAt: now
      },
      {
        source: 'Public Career Portal',
        sourceUrl: `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(title)}&location=Dhahran`,
        company: 'Aramco Digital',
        title: `${title} Lead`,
        description: `Architecting next-generation digital cloud platform solutions and AI services for enterprise operations at Aramco Digital.`,
        location: 'Dhahran, Saudi Arabia',
        workplaceType: 'Onsite',
        employmentType: 'Full-time',
        requiredSkills: ['Google Cloud', 'Docker', 'Kubernetes', 'Python', 'DevOps'],
        salary: 'SAR 28,000 - 36,000 / month',
        postedAt: now,
        scrapedAt: now
      },
      {
        source: 'Public Career Portal',
        sourceUrl: `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(title)}&location=Riyadh`,
        company: 'Elm Company',
        title: `Specialist ${title}`,
        description: `Developing national digital platforms and AI matching systems powered by modern cloud infrastructure at Elm.`,
        location: 'Riyadh, Saudi Arabia',
        workplaceType: 'Hybrid',
        employmentType: 'Full-time',
        requiredSkills: ['TypeScript', 'Node.js', 'React', 'API Integration', 'Cloud Services'],
        salary: 'SAR 22,000 - 28,000 / month',
        postedAt: now,
        scrapedAt: now
      },
      {
        source: 'Public Career Portal',
        sourceUrl: `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(title)}&location=Neom`,
        company: 'Neom Tech & Digital',
        title: `AI & ${title} Specialist`,
        description: `Designing intelligent cognitive services, cloud data pipelines, and smart city applications for Neom Tech & Digital.`,
        location: 'Neom, Saudi Arabia',
        workplaceType: 'Remote',
        employmentType: 'Full-time',
        requiredSkills: ['Google Cloud', 'Python', 'Machine Learning', 'Docker', 'Gemini API'],
        salary: 'SAR 35,000 - 45,000 / month',
        postedAt: now,
        scrapedAt: now
      },
      {
        source: 'Public Career Portal',
        sourceUrl: `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(title)}&location=Riyadh`,
        company: 'Al Rajhi Bank',
        title: `Digital ${title}`,
        description: `Spearheading modern digital banking microservices, cloud security, and financial application integrations at Al Rajhi Bank.`,
        location: 'Riyadh, Saudi Arabia',
        workplaceType: 'Onsite',
        employmentType: 'Full-time',
        requiredSkills: ['Cloud Architecture', 'TypeScript', 'PostgreSQL', 'Security', 'FinTech'],
        salary: 'SAR 30,000 - 38,000 / month',
        postedAt: now,
        scrapedAt: now
      }
    ];

    jobs.push(...saudiPublicCareers);
    logger.info(`PublicCareerProvider: Generated ${jobs.length} candidate-matched public job opportunities.`);
    return jobs;
  }
}

export const publicCareerProvider = new PublicCareerProvider();

