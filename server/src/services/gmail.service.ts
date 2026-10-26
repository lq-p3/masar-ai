import { OAuth2Client } from 'google-auth-library';
import { getFirestore } from 'firebase-admin/firestore';
import { logger } from '../utils/logger.js';
import { AppError } from '../types/api.types.js';
import { jobService } from './job.service.js';
import { getAIProviderClient } from './ai-provider.service.js';


export interface GmailAuthStatus {
  connected: boolean;
  connectedEmail?: string;
  lastSync?: string;
  analyzedCount: number;
  status: 'NOT_CONNECTED' | 'CONNECTING' | 'CONNECTED' | 'SYNCING' | 'ERROR';
}

export interface SyncedRecruitmentEmail {
  id: string;
  gmailMessageId: string;
  gmailThreadId?: string;
  source: 'gmail';
  company: string;
  jobTitle: string;
  sender: string;
  date: string;
  category: 'Interview' | 'Assessment' | 'Under Review' | 'Offer' | 'Rejection' | 'Application Received';
  confidenceScore: number;
  summary: string;
  snippet: string;
  actionRequired: boolean;
  actionText?: string;
  syncedAt?: string;
}

interface EmailClassificationResult {
  isRecruitment: boolean;
  company: string;
  jobTitle: string;
  category: SyncedRecruitmentEmail['category'];
  confidenceScore: number;
  summary: string;
  actionRequired: boolean;
  actionText?: string;
}

async function classifyEmailWithGemini(subject: string, sender: string, snippet: string): Promise<EmailClassificationResult> {
  try {
    const client = getAIProviderClient();
    const prompt = `You are a Recruitment Email Intelligence Classifier.
Analyze the following email metadata and snippet from a candidate's inbox:
Sender: "${sender}"
Subject: "${subject}"
Snippet: "${snippet}"

Task 1: Determine if this email is a GENUINE recruitment or job application email regarding the candidate (e.g. application received, status update, assessment invitation, interview request, job offer, or rejection letter).
Set "isRecruitment": false if it is a general newsletter, marketing spam, job recommendation digest, social notification, or unrelated email.

Task 2: If "isRecruitment" is true, extract:
- "company": exact hiring company name.
- "jobTitle": specific position title.
- "category": one of ["Interview", "Assessment", "Under Review", "Offer", "Rejection", "Application Received"].
- "confidenceScore": integer 60-99.
- "summary": 1-2 sentence concise factual summary in English/Arabic matching email language.
- "actionRequired": boolean.
- "actionText": short action title if actionRequired is true (e.g. "Select Interview Slot", "Complete Technical Test", "Review Offer").

Return strictly valid JSON with NO markdown syntax:
{
  "isRecruitment": true,
  "company": "Company Name",
  "jobTitle": "Position Title",
  "category": "Under Review",
  "confidenceScore": 88,
  "summary": "1-2 sentence summary",
  "actionRequired": false,
  "actionText": ""
}`;

    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });

    if (response.text) {
      const cleaned = response.text.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleaned);

      const validCategory: SyncedRecruitmentEmail['category'] = 
        ['Interview', 'Assessment', 'Under Review', 'Offer', 'Rejection', 'Application Received'].includes(parsed.category) 
          ? parsed.category 
          : 'Under Review';

      const cleanCompany = typeof parsed.company === 'string' && parsed.company.trim() && parsed.company !== 'Tech Company'
        ? parsed.company.trim() 
        : (sender.split('<')[0].replace(/"/g, '').trim() || 'Hiring Company');

      return {
        isRecruitment: Boolean(parsed.isRecruitment),
        company: cleanCompany,
        jobTitle: typeof parsed.jobTitle === 'string' && parsed.jobTitle.trim() ? parsed.jobTitle.trim() : subject,
        category: validCategory,
        confidenceScore: Math.min(99, Math.max(50, Number(parsed.confidenceScore) || 85)),
        summary: typeof parsed.summary === 'string' && parsed.summary.trim() ? parsed.summary.trim() : (snippet || subject),
        actionRequired: Boolean(parsed.actionRequired),
        actionText: typeof parsed.actionText === 'string' ? parsed.actionText.trim() : ''
      };
    }
  } catch (err) {
    logger.warn(`Gemini AI email classification error for subject "${subject}":`, { error: String(err) });
  }

  // Rule-based fallback if Gemini AI service is unavailable
  const lower = (subject + ' ' + snippet + ' ' + sender).toLowerCase();
  const isRecruitment = lower.includes('application') || lower.includes('interview') || lower.includes('assessment') || lower.includes('offer') || lower.includes('rejection') || lower.includes('applied') || lower.includes('توظيف') || lower.includes('مقابلة');

  let category: SyncedRecruitmentEmail['category'] = 'Under Review';
  let actionRequired = false;
  let actionText = '';

  if (lower.includes('interview') || lower.includes('schedule') || lower.includes('مقابلة')) {
    category = 'Interview';
    actionRequired = true;
    actionText = 'Select Interview Slot';
  } else if (lower.includes('assessment') || lower.includes('test') || lower.includes('اختبار')) {
    category = 'Assessment';
    actionRequired = true;
    actionText = 'Complete Technical Test';
  } else if (lower.includes('offer') || lower.includes('عرض')) {
    category = 'Offer';
    actionRequired = true;
    actionText = 'Review Offer Details';
  } else if (lower.includes('regret') || lower.includes('unfortunately') || lower.includes('rejected') || lower.includes('نعتذر')) {
    category = 'Rejection';
  } else if (lower.includes('received') || lower.includes('confirmation') || lower.includes('applied')) {
    category = 'Application Received';
  }

  const senderName = sender.split('<')[0].replace(/"/g, '').trim() || 'Recruiter';

  return {
    isRecruitment,
    company: senderName,
    jobTitle: subject.length > 50 ? subject.substring(0, 50) + '...' : subject,
    category,
    confidenceScore: 82,
    summary: snippet || subject,
    actionRequired,
    actionText
  };
}

export class GmailService {
  private get db() {
    return getFirestore();
  }

  private userGmailDoc(uid: string) {
    return this.db.collection('users').doc(uid).collection('preferences').doc('gmailAuth');
  }

  private userEmailsCollection(uid: string) {
    return this.db.collection('users').doc(uid).collection('gmailEmails');
  }

  public getOAuth2Client(): OAuth2Client {
    const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI || 'https://masar-ai-backend-828667104263.us-west4.run.app/api/gmail/callback';

    if (!clientId || !clientSecret) {
      throw new AppError('Google OAuth Credentials not configured. REQUIRES GOOGLE CLOUD OAUTH CONFIGURATION.', 503, 'GMAIL_OAUTH_NOT_CONFIGURED');
    }

    return new OAuth2Client(clientId, clientSecret, redirectUri);
  }

  public getAuthUrl(uid: string): string {
    const client = this.getOAuth2Client();
    return client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/userinfo.email'
      ],
      state: uid,
      prompt: 'consent'
    });
  }

  public async getStatus(uid: string): Promise<GmailAuthStatus> {
    try {
      const doc = await this.userGmailDoc(uid).get();
      if (!doc.exists) {
        return {
          connected: false,
          analyzedCount: 0,
          status: 'NOT_CONNECTED'
        };
      }
      const data = doc.data();
      return {
        connected: !!data?.connected,
        connectedEmail: data?.connectedEmail,
        lastSync: data?.lastSync,
        analyzedCount: data?.analyzedCount || 0,
        status: data?.status || (data?.connected ? 'CONNECTED' : 'NOT_CONNECTED')
      };
    } catch (error) {
      logger.error(`Error fetching Gmail status for user ${uid}`, error);
      return {
        connected: false,
        analyzedCount: 0,
        status: 'NOT_CONNECTED'
      };
    }
  }

  public async saveOAuthTokens(uid: string, code: string): Promise<string> {
    const client = this.getOAuth2Client();
    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);

    let connectedEmail = '';
    try {
      const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokens.access_token}` }
      });
      if (res.ok) {
        const userInfo = await res.json() as { email?: string };
        if (userInfo.email) {
          connectedEmail = userInfo.email;
        }
      }
    } catch (err) {
      logger.warn(`Failed to fetch Google userinfo email for user ${uid}:`, { error: String(err) });
    }

    if (!connectedEmail) {
      throw new AppError('Unable to verify authenticated Google email identity.', 400, 'GMAIL_USERINFO_FAILED');
    }

    const existingDoc = await this.userGmailDoc(uid).get();
    const existingTokens = existingDoc.exists ? existingDoc.data()?.tokens : null;

    const tokenPayload = {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || existingTokens?.refresh_token || null,
      expiry_date: tokens.expiry_date,
      token_type: tokens.token_type,
      id_token: tokens.id_token
    };

    await this.userGmailDoc(uid).set({
      connected: true,
      status: 'CONNECTED',
      connectedEmail,
      tokens: tokenPayload,
      lastSync: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }, { merge: true });

    logger.info(`Saved OAuth tokens for user ${uid} (${connectedEmail})`);
    return connectedEmail;
  }

  private async getValidAccessToken(uid: string): Promise<string> {
    const doc = await this.userGmailDoc(uid).get();
    if (!doc.exists) {
      throw new AppError('Gmail account is not connected', 400, 'GMAIL_NOT_CONNECTED');
    }

    const data = doc.data();
    const tokens = data?.tokens;
    if (!tokens || !tokens.access_token) {
      throw new AppError('Missing OAuth tokens for Gmail connection', 400, 'GMAIL_NOT_CONNECTED');
    }

    const client = this.getOAuth2Client();
    client.setCredentials(tokens);

    const isExpired = tokens.expiry_date ? Date.now() >= tokens.expiry_date - 60000 : false;
    if (isExpired && tokens.refresh_token) {
      try {
        const { credentials } = await client.refreshAccessToken();
        const updatedTokens = {
          ...tokens,
          access_token: credentials.access_token,
          expiry_date: credentials.expiry_date
        };
        await this.userGmailDoc(uid).set({ tokens: updatedTokens }, { merge: true });
        return credentials.access_token!;
      } catch (refreshErr) {
        logger.error(`Failed to refresh Gmail OAuth token for user ${uid}:`, refreshErr);
        throw new AppError('Gmail authentication expired. Please reconnect your Gmail account.', 401, 'GMAIL_AUTH_EXPIRED');
      }
    }

    return tokens.access_token;
  }

  public async getSyncedEmails(uid: string): Promise<SyncedRecruitmentEmail[]> {
    const snapshot = await this.userEmailsCollection(uid).orderBy('date', 'desc').get();
    return snapshot.docs.map(doc => ({
      id: doc.id,
      gmailMessageId: doc.id,
      source: 'gmail',
      ...doc.data()
    })) as SyncedRecruitmentEmail[];
  }

  public async syncGmail(uid: string): Promise<{ 
    synced: boolean; 
    connectedEmail: string;
    fetched: number; 
    recruitmentEmails: number;
    newEmails: number;
    duplicatesSkipped: number;
    lastSync: string; 
    emails: SyncedRecruitmentEmail[] 
  }> {
    const accessToken = await this.getValidAccessToken(uid);
    const statusDoc = await this.getStatus(uid);
    const connectedEmail = statusDoc.connectedEmail || 'connected-account@gmail.com';

    const query = 'subject:(application OR offer OR interview OR assessment OR recruitment OR job OR "applied for" OR "application received" OR status OR shortlisted OR test OR candidate OR مقابلة OR توظيف OR "طلب عمل" OR "عرض عمل" OR "تم استلام")';
    const listUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=30`;

    const listRes = await fetch(listUrl, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!listRes.ok) {
      const errText = await listRes.text();
      logger.error(`Gmail API list error for user ${uid}:`, errText);
      throw new AppError('Failed to fetch messages from Gmail API', 502, 'GMAIL_API_ERROR');
    }

    const listData = await listRes.json() as { messages?: Array<{ id: string }> };
    const messages = listData.messages || [];

    const fetchedEmails: SyncedRecruitmentEmail[] = [];
    let newEmailsCount = 0;
    let duplicatesSkippedCount = 0;

    for (const msgRef of messages) {
      try {
        const msgUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msgRef.id}?format=full`;
        const msgRes = await fetch(msgUrl, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (!msgRes.ok) continue;

        const msgData = await msgRes.json() as any;
        const headers = msgData.payload?.headers || [];
        const subject = headers.find((h: any) => h.name.toLowerCase() === 'subject')?.value || 'Recruitment Update';
        const from = headers.find((h: any) => h.name.toLowerCase() === 'from')?.value || 'Recruiter';
        const dateRaw = headers.find((h: any) => h.name.toLowerCase() === 'date')?.value;
        const snippet = msgData.snippet || '';
        const threadId = msgData.threadId || msgRef.id;

        // Duplicate check
        const existingDoc = await this.userEmailsCollection(uid).doc(msgRef.id).get();
        if (existingDoc.exists) {
          duplicatesSkippedCount++;
        } else {
          newEmailsCount++;
        }

        // Gemini AI Classification
        const classification = await classifyEmailWithGemini(subject, from, snippet);
        
        // Skip non-recruitment emails
        if (!classification.isRecruitment) {
          logger.info(`Skipped non-recruitment email ${msgRef.id} for user ${uid}`);
          continue;
        }

        const emailDoc: SyncedRecruitmentEmail = {
          id: msgRef.id,
          gmailMessageId: msgRef.id,
          gmailThreadId: threadId,
          source: 'gmail',
          company: classification.company,
          jobTitle: classification.jobTitle,
          sender: from,
          date: dateRaw ? new Date(dateRaw).toISOString() : new Date().toISOString(),
          category: classification.category,
          confidenceScore: classification.confidenceScore,
          summary: classification.summary,
          snippet: snippet || classification.summary,
          actionRequired: classification.actionRequired,
          actionText: classification.actionText,
          syncedAt: new Date().toISOString()
        };

        await this.userEmailsCollection(uid).doc(msgRef.id).set(emailDoc, { merge: true });
        fetchedEmails.push(emailDoc);
      } catch (msgErr) {
        logger.warn(`Failed to process message ${msgRef.id} for user ${uid}:`, { error: String(msgErr) });
      }
    }

    const lastSync = new Date().toISOString();
    await this.userGmailDoc(uid).set({
      lastSync,
      analyzedCount: fetchedEmails.length,
      updatedAt: lastSync
    }, { merge: true });

    logger.info(`Completed Gmail sync for user ${uid}: fetched ${messages.length}, recruitment: ${fetchedEmails.length}, new: ${newEmailsCount}, duplicates skipped: ${duplicatesSkippedCount}`);

    return {
      synced: true,
      connectedEmail,
      fetched: messages.length,
      recruitmentEmails: fetchedEmails.length,
      newEmails: newEmailsCount,
      duplicatesSkipped: duplicatesSkippedCount,
      lastSync,
      emails: fetchedEmails
    };
  }

  public async disconnect(uid: string): Promise<void> {
    try {
      await this.userGmailDoc(uid).delete();
      const snapshot = await this.userEmailsCollection(uid).get();
      const batch = this.db.batch();
      snapshot.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      logger.info(`Disconnected Gmail OAuth for user ${uid}`);
    } catch (error) {
      logger.error(`Error disconnecting Gmail for user ${uid}`, error);
      throw new AppError('Unable to disconnect Gmail account', 500, 'DATABASE_ERROR', error);
    }
  }
}

export const gmailService = new GmailService();


