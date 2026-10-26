import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { JobApplication, RecruitmentEmail, ActionTask, ApplicationStatus } from '../types';
import { useAuth } from './AuthContext';
import * as api from '../services/api';

type ApplicationContextType = {
  applications: JobApplication[];
  emails: RecruitmentEmail[];
  tasks: ActionTask[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isAddModalOpen: boolean;
  setIsAddModalOpen: (open: boolean) => void;
  isAIDrawerOpen: boolean;
  setIsAIDrawerOpen: (open: boolean) => void;
  isLoadingData: boolean;
  apiError: string | null;
  addApplication: (app: Omit<JobApplication, 'id' | 'dateApplied' | 'lastUpdate'>) => Promise<void>;
  updateApplicationStatus: (id: string, status: ApplicationStatus) => Promise<void>;
  deleteApplication: (id: string) => Promise<void>;
  toggleTask: (id: string) => Promise<void>;
  addTask: (text: string, company?: string, dueDate?: string, urgent?: boolean) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  refreshApplications: () => Promise<void>;
  seedSampleData: () => Promise<void>;
};

const ApplicationContext = createContext<ApplicationContextType | undefined>(undefined);

export function ApplicationProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [emails, setEmails] = useState<RecruitmentEmail[]>([]);
  const [tasks, setTasks] = useState<ActionTask[]>([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAIDrawerOpen, setIsAIDrawerOpen] = useState(false);
  
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const refreshApplications = useCallback(async () => {
    // Wait until Firebase Auth finishes restoring session from IndexedDB/localStorage
    if (authLoading) return;

    if (!user) {
      setApplications([]);
      setEmails([]);
      setTasks([]);
      return;
    }

    setIsLoadingData(true);
    setApiError(null);
    try {
      const [fetchedApps, fetchedTasks, gmailData] = await Promise.all([
        api.getApplications(),
        api.getTasks().catch(err => {
          console.warn('Failed to fetch tasks:', err);
          return [] as ActionTask[];
        }),
        api.getGmailStatus().catch(err => {
          console.warn('Failed to fetch Gmail status:', err);
          return null;
        })
      ]);

      setApplications(fetchedApps);
      setTasks(fetchedTasks);
      if (gmailData && gmailData.emails) {
        setEmails(gmailData.emails as RecruitmentEmail[]);
      } else {
        setEmails([]);
      }
    } catch (err) {
      console.error('Error refreshing backend user data:', err);
      const msg = (err as Error)?.message || 'Unable to load data from backend server.';
      setApiError(msg);
    } finally {
      setIsLoadingData(false);
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (!authLoading) {
      refreshApplications();
    }
  }, [authLoading, refreshApplications]);

  const addApplication = async (appData: Omit<JobApplication, 'id' | 'dateApplied' | 'lastUpdate'>) => {
    setApiError(null);
    try {
      const created = await api.createApplication(appData);
      setApplications(prev => [created, ...prev]);
      return created;
    } catch (err) {
      console.error('Failed to create application on server:', err);
      const msg = (err as Error)?.message || 'Failed to create job application on server.';
      setApiError(msg);
      throw err;
    }
  };

  const updateApplicationStatus = async (id: string, status: ApplicationStatus) => {
    setApiError(null);
    // Optimistic UI update with rollback support
    const previousApps = [...applications];
    setApplications(prev => prev.map(app => 
      app.id === id ? { ...app, status, lastUpdate: 'Just now' } : app
    ));

    try {
      const updated = await api.updateApplication(id, { status });
      setApplications(prev => prev.map(app => app.id === id ? updated : app));
    } catch (err) {
      console.error(`Failed to update application ${id}:`, err);
      setApplications(previousApps);
      const msg = (err as Error)?.message || 'Failed to update application status.';
      setApiError(msg);
      throw err;
    }
  };

  const deleteApplication = async (id: string) => {
    setApiError(null);
    const previousApps = [...applications];
    setApplications(prev => prev.filter(app => app.id !== id));

    try {
      await api.deleteApplication(id);
    } catch (err) {
      console.error(`Failed to delete application ${id}:`, err);
      setApplications(previousApps);
      const msg = (err as Error)?.message || 'Failed to delete application.';
      setApiError(msg);
      throw err;
    }
  };

  const addTask = async (text: string, company?: string, dueDate: string = 'TODAY', urgent: boolean = false) => {
    setApiError(null);
    try {
      const created = await api.createTask({ text, company, dueDate, urgent });
      setTasks(prev => [created, ...prev]);
    } catch (err) {
      console.error('Failed to create task:', err);
      const msg = (err as Error)?.message || 'Failed to create task on server.';
      setApiError(msg);
      throw err;
    }
  };

  const toggleTask = async (id: string) => {
    setApiError(null);
    const targetTask = tasks.find(t => t.id === id);
    if (!targetTask) return;

    const newCompleted = !targetTask.completed;
    const previousTasks = [...tasks];
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: newCompleted } : t));

    try {
      const updated = await api.updateTask(id, { completed: newCompleted });
      setTasks(prev => prev.map(t => t.id === id ? updated : t));
    } catch (err) {
      console.error(`Failed to toggle task ${id}:`, err);
      setTasks(previousTasks);
      const msg = (err as Error)?.message || 'Failed to update task.';
      setApiError(msg);
    }
  };

  const deleteTask = async (id: string) => {
    setApiError(null);
    const previousTasks = [...tasks];
    setTasks(prev => prev.filter(t => t.id !== id));

    try {
      await api.deleteTask(id);
    } catch (err) {
      console.error(`Failed to delete task ${id}:`, err);
      setTasks(previousTasks);
      const msg = (err as Error)?.message || 'Failed to delete task.';
      setApiError(msg);
    }
  };

  const seedSampleData = async () => {
    if (!user) return;
    setIsLoadingData(true);
    try {
      const defaultSamples = [
        { company: 'Stc Pay', title: 'Senior Backend Engineer', location: 'Riyadh, KSA', status: 'Applied' as const, source: 'LinkedIn', matchScore: 92 },
        { company: 'Aramco Digital', title: 'Cloud Solutions Architect', location: 'Dhahran, KSA', status: 'Under Review' as const, source: 'Company Website', matchScore: 88 },
        { company: 'Neom Tech & Digital', title: 'AI Systems Engineer', location: 'Neom, KSA', status: 'Interview' as const, source: 'Referral', matchScore: 95 }
      ];
      for (const app of defaultSamples) {
        await api.createApplication(app);
      }
      await refreshApplications();
    } catch (err) {
      console.error('Failed to seed sample applications:', err);
    } finally {
      setIsLoadingData(false);
    }
  };

  return (
    <ApplicationContext.Provider value={{
      applications,
      emails,
      tasks,
      searchQuery,
      setSearchQuery,
      isAddModalOpen,
      setIsAddModalOpen,
      isAIDrawerOpen,
      setIsAIDrawerOpen,
      isLoadingData,
      apiError,
      addApplication,
      updateApplicationStatus,
      deleteApplication,
      toggleTask,
      addTask,
      deleteTask,
      refreshApplications,
      seedSampleData
    }}>
      {children}
    </ApplicationContext.Provider>
  );
}

export function useApplications() {
  const context = useContext(ApplicationContext);
  if (!context) {
    throw new Error('useApplications must be used within an ApplicationProvider');
  }
  return context;
}

