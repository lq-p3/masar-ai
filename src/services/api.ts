import { JobApplication, ActionTask } from '../types';
import { auth } from '../config/firebase';

const API_BASE_URL = typeof import.meta.env.VITE_API_BASE_URL === 'string' ? import.meta.env.VITE_API_BASE_URL : '';

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

export interface ResumeDocument {
  id: string;
  userId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  gcsBucket: string;
  gcsObjectName: string;
  gcsPath?: string;
  resumeText?: string;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
}

async function getAuthToken(forceRefresh: boolean = false): Promise<string | null> {
  if (!auth) return null;
  try {
    await auth.authStateReady();
    if (!auth.currentUser) return null;
    return await auth.currentUser.getIdToken(forceRefresh);
  } catch (err) {
    console.warn('Failed to retrieve Firebase ID token:', err);
    return null;
  }
}

async function fetchApi<T>(endpoint: string, options?: RequestInit, retryCount: number = 0): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  const forceRefresh = retryCount > 0;
  const token = await getAuthToken(forceRefresh);

  if (!token) {
    clearTimeout(timeoutId);
    throw new Error('يرجى تسجيل الدخول بحسابك أولاً لإتمام هذه العملية.');
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...(options?.headers as Record<string, string>)
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers
    });

    clearTimeout(timeoutId);

    if (response.status === 401 && retryCount < 2 && auth.currentUser) {
      console.info(`[API] Received 401 for ${endpoint}. Force refreshing ID token (attempt ${retryCount + 1})...`);
      return fetchApi<T>(endpoint, options, retryCount + 1);
    }

    const json = await response.json();

    if (!response.ok || json.success === false) {
      const errorMessage = json?.error?.message || (response.status === 401 ? 'انتهت جلسة الدخول. يرجى إعادة تسجيل الدخول.' : `HTTP ${response.status}: Request failed`);
      const error = new Error(errorMessage);
      (error as { status?: number }).status = response.status;
      (error as { code?: string }).code = json?.error?.code || 'API_ERROR';
      throw error;
    }

    return json.data as T;

  } catch (error) {
    console.warn(`[API] Error fetching ${endpoint}:`, error);
    throw error;
  }
}

// User Profile API
export async function getCurrentUserProfile() {
  return fetchApi('/api/me');
}

export async function updateCurrentUserProfile(payload: Record<string, unknown>) {
  return fetchApi('/api/me', {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });
}

function mapBackendDocToApplication(doc: any): JobApplication {
  return {
    id: doc.id,
    company: doc.company || '',
    title: doc.position || doc.title || '',
    location: doc.location || '',
    status: doc.status || 'Applied',
    dateApplied: doc.createdAt || doc.dateApplied || new Date().toISOString(),
    lastUpdate: doc.updatedAt ? new Date(doc.updatedAt).toLocaleDateString() : (doc.lastUpdate || 'Just now'),
    matchScore: typeof doc.matchScore === 'number' ? doc.matchScore : undefined,
    source: doc.source || 'Direct App',
    salary: doc.salary,
    notes: doc.notes
  };
}

// Applications API
export async function getApplications(): Promise<JobApplication[]> {
  const docs = await fetchApi<any[]>('/api/applications');
  return (Array.isArray(docs) ? docs : []).map(mapBackendDocToApplication);
}

export async function getApplication(id: string): Promise<JobApplication> {
  const doc = await fetchApi<any>(`/api/applications/${id}`);
  return mapBackendDocToApplication(doc);
}

export async function createApplication(data: Omit<JobApplication, 'id' | 'dateApplied' | 'lastUpdate'>): Promise<JobApplication> {
  const doc = await fetchApi<any>('/api/applications', {
    method: 'POST',
    body: JSON.stringify({
      company: data.company,
      position: data.title,
      location: data.location,
      status: data.status,
      source: data.source,
      matchScore: data.matchScore,
      ...(data.salary ? { salary: data.salary } : {}),
      ...(data.notes ? { notes: data.notes } : {})
    })
  });
  return mapBackendDocToApplication(doc);
}

export async function updateApplication(id: string, data: Partial<JobApplication>): Promise<JobApplication> {
  const doc = await fetchApi<any>(`/api/applications/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      ...(data.company ? { company: data.company } : {}),
      ...(data.title ? { position: data.title } : {}),
      ...(data.location ? { location: data.location } : {}),
      ...(data.status ? { status: data.status } : {}),
      ...(data.source ? { source: data.source } : {}),
      ...(data.matchScore !== undefined ? { matchScore: data.matchScore } : {}),
      ...(data.salary ? { salary: data.salary } : {}),
      ...(data.notes ? { notes: data.notes } : {})
    })
  });
  return mapBackendDocToApplication(doc);
}

export async function deleteApplication(id: string): Promise<{ id: string; deleted: boolean }> {
  return fetchApi<{ id: string; deleted: boolean }>(`/api/applications/${id}`, {
    method: 'DELETE'
  });
}

// Tasks API
export async function getTasks(): Promise<ActionTask[]> {
  return fetchApi<ActionTask[]>('/api/tasks');
}

export async function createTask(task: { text: string; company?: string; dueDate?: string; urgent?: boolean }): Promise<ActionTask> {
  return fetchApi<ActionTask>('/api/tasks', {
    method: 'POST',
    body: JSON.stringify(task)
  });
}

export async function updateTask(id: string, data: Partial<ActionTask>): Promise<ActionTask> {
  return fetchApi<ActionTask>(`/api/tasks/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  });
}

export async function deleteTask(id: string): Promise<{ id: string; deleted: boolean }> {
  return fetchApi<{ id: string; deleted: boolean }>(`/api/tasks/${id}`, {
    method: 'DELETE'
  });
}

// Resumes API
export async function getUserResumes(): Promise<ResumeDocument[]> {
  return fetchApi<ResumeDocument[]>('/api/resumes');
}

export async function uploadResume(file: File): Promise<ResumeDocument> {
  const url = `${API_BASE_URL}/api/resumes/upload`;
  const token = await getAuthToken(false);
  if (!token) {
    throw new Error('يرجى تسجيل الدخول بحسابك أولاً لإتمام هذه العملية.');
  }

  const formData = new FormData();
  formData.append('resume', file);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });

  const json = await response.json();
  if (!response.ok || json.success === false) {
    const errorMessage = json?.error?.message || `HTTP ${response.status}: Failed to upload resume`;
    const error = new Error(errorMessage);
    (error as { status?: number }).status = response.status;
    (error as { code?: string }).code = json?.error?.code || 'UPLOAD_ERROR';
    throw error;
  }

  return json.data as ResumeDocument;
}

export async function setPrimaryResume(id: string): Promise<ResumeDocument> {
  return fetchApi<ResumeDocument>(`/api/resumes/${id}/primary`, {
    method: 'PATCH'
  });
}

export async function deleteResume(id: string): Promise<{ id: string; deleted: boolean }> {
  return fetchApi<{ id: string; deleted: boolean }>(`/api/resumes/${id}`, {
    method: 'DELETE'
  });
}

// AI API
export async function generateCoverLetter(payload: { company: string; title: string; tone?: string; language?: string }): Promise<{ coverLetter: string }> {
  return fetchApi<{ coverLetter: string }>('/api/ai/cover-letter', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function generateStarResponse(payload: { company: string; role: string; prompt: string; language?: string }): Promise<{ starResponse: string }> {
  return fetchApi<{ starResponse: string }>('/api/ai/star-prep', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function generateSalaryAdvice(payload: { role: string; location?: string; currentSalary?: string; expectedSalary?: string; language?: string }): Promise<{ advice: string }> {
  return fetchApi<{ advice: string }>('/api/ai/salary-advice', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function chatWithAI(payload: { message: string; applicationsCount?: number; language?: string }): Promise<{ reply: string }> {
  return fetchApi<{ reply: string }>('/api/ai/chat', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function analyzeResumeMatch(payload: { jobDescription: string; language?: string; resumeId?: string }): Promise<{
  score: number;
  matchingSkills: string[];
  missingSkills: string[];
  recommendation: string;
}> {
  return fetchApi<{
    score: number;
    matchingSkills: string[];
    missingSkills: string[];
    recommendation: string;
  }>('/api/ai/resume-match', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function analyzeCVAudit(payload?: { language?: string; resumeId?: string }): Promise<{
  score: number;
  executiveSummary: string;
  targetTitles: string[];
  coreSkills: string[];
  strengths: string[];
  improvements: string[];
}> {
  return fetchApi<{
    score: number;
    executiveSummary: string;
    targetTitles: string[];
    coreSkills: string[];
    strengths: string[];
    improvements: string[];
  }>('/api/ai/cv-audit', {
    method: 'POST',
    body: JSON.stringify(payload || {})
  });
}



// Job Recommendations API
export async function getJobRecommendations(): Promise<any[]> {
  return fetchApi<any[]>('/api/jobs/recommendations');
}

export async function discoverJobsFromCV(): Promise<any[]> {
  return fetchApi<any[]>('/api/jobs/discover', {
    method: 'POST'
  });
}

export async function applyToJobRecommendation(payload: { company: string; title: string; location?: string; salary?: string }): Promise<any> {
  return fetchApi<any>('/api/jobs/recommendations/apply', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}


// Telegram Notifications API
export async function getTelegramStatus() {
  return fetchApi<{
    configured: boolean;
    connected: boolean;
    enabled: boolean;
    maskedChatId: string | null;
    dailyReportEnabled: boolean;
    interviewAlertsEnabled: boolean;
    applicationUpdatesEnabled: boolean;
    jobRecommendationsEnabled: boolean;
    lastReportAt: string | null;
    status: 'NOT_CONFIGURED' | 'CONNECTED' | 'DISCONNECTED';
  }>('/api/notifications/telegram/status');
}

export async function connectTelegram(chatId: string, language: 'ar' | 'en' = 'ar') {
  return fetchApi('/api/notifications/telegram/connect', {
    method: 'POST',
    body: JSON.stringify({ chatId, language })
  });
}

export async function updateTelegramPreferences(payload: {
  enabled?: boolean;
  dailyReportEnabled?: boolean;
  interviewAlertsEnabled?: boolean;
  applicationUpdatesEnabled?: boolean;
  jobRecommendationsEnabled?: boolean;
  chatId?: string | null;
  language?: 'ar' | 'en';
}) {
  return fetchApi('/api/notifications/telegram/preferences', {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });
}

export async function sendTestTelegramMessage(chatId?: string, language: 'ar' | 'en' = 'ar') {
  return fetchApi('/api/notifications/telegram/test', {
    method: 'POST',
    body: JSON.stringify({ chatId, language })
  });
}

export async function sendFullTelegramReport() {
  return fetchApi<{ success: boolean; telegramMessageId?: number }>('/api/notifications/telegram/send-full-report', {
    method: 'POST'
  });
}

export async function disconnectTelegram() {
  return fetchApi('/api/notifications/telegram/disconnect', {
    method: 'POST'
  });
}


// Gmail OAuth API
export async function getGmailConnectUrl(): Promise<string> {
  const data = await fetchApi<{ url: string }>('/api/gmail/connect');
  return data.url;
}

export async function getGmailStatus() {
  return fetchApi<{
    connected: boolean;
    connectedEmail?: string;
    lastSync?: string;
    analyzedCount: number;
    status: 'NOT_CONNECTED' | 'CONNECTING' | 'CONNECTED' | 'SYNCING' | 'ERROR';
    emails?: Array<{
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
    }>;
  }>('/api/gmail/status');
}

export async function syncGmail() {
  return fetchApi<{ 
    synced: boolean; 
    connectedEmail: string;
    fetched: number; 
    recruitmentEmails: number;
    newEmails: number;
    duplicatesSkipped: number;
    lastSync: string; 
  }>('/api/gmail/sync', {
    method: 'POST'
  });
}


export async function disconnectGmail() {
  return fetchApi<{ disconnected: boolean }>('/api/gmail/disconnect', {
    method: 'DELETE'
  });
}

