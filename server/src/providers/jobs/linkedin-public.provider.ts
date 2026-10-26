import { JobProvider, JobSearchQuery, NormalizedJob } from './job-provider.interface.js';
import { logger } from '../../utils/logger.js';

export class LinkedInPublicProvider implements JobProvider {
  public name = 'LinkedIn Public';

  public async searchJobs(query: JobSearchQuery): Promise<NormalizedJob[]> {
    const keywords = encodeURIComponent(query.keywords || 'Software Engineer');
    const location = encodeURIComponent(query.location || 'Riyadh, Saudi Arabia');
    const url = `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=${keywords}&location=${location}&start=0`;

    logger.info(`LinkedInPublicProvider: Fetching public job listings from ${url}`);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9,ar;q=0.8'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Check if LinkedIn restricted public access or redirected to login wall / CAPTCHA
      if (!res.ok) {
        logger.warn(`LinkedIn Public Job Scraping access restricted (HTTP ${res.status}). Stopping LinkedIn provider per rules.`);
        return [];
      }

      const html = await res.text();
      if (html.includes('authwall') || html.includes('captcha') || html.includes('sign-in')) {
        logger.warn('LinkedIn returned authentication wall / CAPTCHA. Stopping LinkedIn provider cleanly.');
        return [];
      }

      return this.parseLinkedInHtml(html, query);
    } catch (err) {
      logger.warn(`LinkedInPublicProvider request failed or timed out: ${(err as Error).message}. Returning empty list without fallback.`);
      return [];
    }
  }

  private parseLinkedInHtml(html: string, query: JobSearchQuery): NormalizedJob[] {
    const jobs: NormalizedJob[] = [];
    const now = new Date().toISOString();

    // Regex parsing of LinkedIn public guest job cards
    const cardRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
    let match: RegExpExecArray | null;

    while ((match = cardRegex.exec(html)) !== null && jobs.length < (query.limit || 15)) {
      const cardHtml = match[1];

      // Extract title
      const titleMatch = cardHtml.match(/class="[^"]*base-search-card__title[^"]*"[^>]*>\s*([\s\S]*?)\s*<\/(?:h3|h4|span)>/i) ||
                         cardHtml.match(/class="[^"]*job-search-card__title[^"]*"[^>]*>\s*([\s\S]*?)\s*<\/(?:h3|h4|span)>/i);
      
      // Extract company
      const companyMatch = cardHtml.match(/class="[^"]*base-search-card__subtitle[^"]*"[^>]*>\s*<a[^>]*>\s*([\s\S]*?)\s*<\/a>/i) ||
                           cardHtml.match(/class="[^"]*job-search-card__company-name[^"]*"[^>]*>\s*([\s\S]*?)\s*<\/(?:h4|a|span)>/i);

      // Extract location
      const locMatch = cardHtml.match(/class="[^"]*job-search-card__location[^"]*"[^>]*>\s*([\s\S]*?)\s*<\/span>/i);

      // Extract job URL & ID
      const urlMatch = cardHtml.match(/href="(https:\/\/[^"]*linkedin\.com\/jobs\/view\/[^"?]+)/i) ||
                        cardHtml.match(/href="(https:\/\/[^"]*linkedin\.com\/jobs\/[^"?]+)/i);

      // Extract posted date
      const dateMatch = cardHtml.match(/datetime="([^"]+)"/i);

      const title = titleMatch ? this.cleanText(titleMatch[1]) : null;
      const company = companyMatch ? this.cleanText(companyMatch[1]) : null;
      const location = locMatch ? this.cleanText(locMatch[1]) : (query.location || 'Saudi Arabia');
      const sourceUrl = urlMatch ? urlMatch[1] : null;

      if (title && company && sourceUrl) {
        let jobId: string | undefined;
        const idMatch = sourceUrl.match(/\/view\/([0-9]+)/);
        if (idMatch) {
          jobId = idMatch[1];
        }

        const isRemote = (location + ' ' + title).toLowerCase().includes('remote');
        const isHybrid = (location + ' ' + title).toLowerCase().includes('hybrid');

        jobs.push({
          source: 'LinkedIn',
          sourceJobId: jobId,
          sourceUrl,
          company,
          title,
          description: `Public listing for ${title} at ${company} (${location}). Apply directly via LinkedIn public job page.`,
          location,
          workplaceType: isRemote ? 'Remote' : isHybrid ? 'Hybrid' : 'Onsite',
          employmentType: 'Full-time',
          requiredSkills: this.extractSkillsFromTitle(title),
          postedAt: dateMatch ? dateMatch[1] : now,
          scrapedAt: now
        });
      }
    }

    logger.info(`LinkedInPublicProvider: Successfully parsed ${jobs.length} real public LinkedIn job listings.`);
    return jobs;
  }

  private cleanText(raw: string): string {
    return raw
      .replace(/<[^>]*>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private extractSkillsFromTitle(title: string): string[] {
    const t = title.toLowerCase();
    const skills: string[] = [];

    if (t.includes('cloud') || t.includes('gcp') || t.includes('aws') || t.includes('azure')) skills.push('Cloud Architecture');
    if (t.includes('devops') || t.includes('docker') || t.includes('kubernetes')) skills.push('DevOps & Containers');
    if (t.includes('full stack') || t.includes('fullstack')) skills.push('Full Stack Development');
    if (t.includes('backend') || t.includes('node')) skills.push('Node.js Backend');
    if (t.includes('frontend') || t.includes('react')) skills.push('React Frontend');
    if (t.includes('python') || t.includes('machine learning') || t.includes('ai') || t.includes('data')) skills.push('Python & AI');
    if (t.includes('typescript') || t.includes('javascript')) skills.push('TypeScript');

    if (skills.length === 0) {
      skills.push('Software Engineering', 'Problem Solving');
    }

    return skills;
  }
}

export const linkedinPublicProvider = new LinkedInPublicProvider();
