import { IJobProvider, ExternalJobQuery, ExternalJobOpportunity } from './job-provider.interface.js';
import { AppError } from '../../types/api.types.js';
import { logger } from '../../utils/logger.js';

export class LiveJobProvider implements IJobProvider {
  public name = 'ExternalLiveJobProvider';

  public isConfigured(): boolean {
    return Boolean(process.env.LIVE_JOB_PROVIDER_API_KEY || process.env.RAPIDAPI_JOB_SEARCH_KEY);
  }

  public async searchJobs(query: ExternalJobQuery): Promise<ExternalJobOpportunity[]> {
    if (!this.isConfigured()) {
      logger.info('LiveJobProvider search requested but no external API key is configured');
      throw new AppError(
        'No live job provider API is configured yet. REQUIRES JOB PROVIDER API CONFIGURATION.',
        503,
        'JOB_PROVIDER_NOT_CONFIGURED'
      );
    }

    // Provider API call boundary
    return [];
  }
}

export const liveJobProvider = new LiveJobProvider();
