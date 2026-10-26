import { getFirestore } from 'firebase-admin/firestore';
import { logger } from '../utils/logger.js';

export interface UserAIContext {
  uid: string;
  displayName?: string;
  currentJobTitle?: string;
  location?: string;
  preferences?: {
    country?: string;
    cities?: string[];
    jobTitles?: string[];
    skills?: string[];
  };
  totalApplicationsCount: number;
  activeApplicationsSummary: Array<{
    id: string;
    company: string;
    title: string;
    status: string;
    matchScore: number;
  }>;
  upcomingInterviewsCount: number;
  pendingTasksCount: number;
  pendingTasksSummary: Array<{
    id: string;
    text: string;
    company?: string;
  }>;
}

export async function buildUserAIContext(uid: string, userQuestion: string): Promise<UserAIContext> {
  const db = getFirestore();

  let displayName: string | undefined;
  let currentJobTitle: string | undefined;
  let location: string | undefined;
  let preferences: UserAIContext['preferences'];

  try {
    const userDoc = await db.collection('users').doc(uid).get();
    if (userDoc.exists) {
      const data = userDoc.data();
      displayName = data?.displayName;
      currentJobTitle = data?.currentJobTitle;
      location = data?.location;
    }

    const prefDoc = await db.collection('users').doc(uid).collection('preferences').doc('jobSearch').get();
    if (prefDoc.exists) {
      preferences = prefDoc.data() as UserAIContext['preferences'];
    }
  } catch (err) {
    logger.warn(`Could not load user profile metadata for AI context (uid: ${uid})`, { err });
  }

  // Load user applications
  let totalApplicationsCount = 0;
  const activeApplicationsSummary: UserAIContext['activeApplicationsSummary'] = [];
  let upcomingInterviewsCount = 0;

  try {
    const appsSnapshot = await db.collection('applications').where('userId', '==', uid).limit(50).get();
    totalApplicationsCount = appsSnapshot.size;

    appsSnapshot.forEach(doc => {
      const appData = doc.data();
      if (appData.status === 'Interview' || appData.status === 'Assessment') {
        upcomingInterviewsCount++;
      }
      activeApplicationsSummary.push({
        id: doc.id,
        company: appData.company || 'Unknown',
        title: appData.position || appData.title || 'Role',
        status: appData.status || 'Applied',
        matchScore: appData.matchScore || 0
      });
    });
  } catch (err) {
    logger.warn(`Could not load applications for AI context (uid: ${uid})`, { err });
  }

  // Load user tasks
  let pendingTasksCount = 0;
  const pendingTasksSummary: UserAIContext['pendingTasksSummary'] = [];

  try {
    const tasksSnapshot = await db.collection('users').doc(uid).collection('tasks').where('completed', '==', false).limit(10).get();
    pendingTasksCount = tasksSnapshot.size;

    tasksSnapshot.forEach(doc => {
      const taskData = doc.data();
      pendingTasksSummary.push({
        id: doc.id,
        text: taskData.text || 'Task',
        company: taskData.company
      });
    });
  } catch (err) {
    logger.warn(`Could not load tasks for AI context (uid: ${uid})`, { err });
  }

  return {
    uid,
    displayName,
    currentJobTitle,
    location,
    preferences,
    totalApplicationsCount,
    activeApplicationsSummary: activeApplicationsSummary.slice(0, 10),
    upcomingInterviewsCount,
    pendingTasksCount,
    pendingTasksSummary: pendingTasksSummary.slice(0, 5)
  };
}
