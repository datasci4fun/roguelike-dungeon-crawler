/**
 * JobsContext - Global state for 3D asset generation jobs
 *
 * Provides cross-page job tracking with automatic polling.
 */

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

const API_BASE = 'http://localhost:8000';

export interface Job {
  job_id: string;
  asset_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
  source_image: string;
  output_dir?: string;
  texture_resolution: number;
  device: string;
  error?: string;
  result_path?: string;
  progress?: string;
  progress_pct?: number;
  logs: string[];
}

export interface WorkerStatus {
  running: boolean;
  status: string;
  message?: string;
  current_job?: string;
  updated_at?: string;
}

interface JobsContextValue {
  jobs: Job[];
  activeJobs: Job[];
  isLoading: boolean;
  error: string | null;
  createJob: (assetId: string) => Promise<Job | null>;
  refreshJobs: () => Promise<void>;
  clearCompletedJobs: () => void;
  // Worker control
  workerStatus: WorkerStatus | null;
  startWorker: () => Promise<boolean>;
  stopWorker: () => Promise<boolean>;
}

const JobsContext = createContext<JobsContextValue | null>(null);

export function useJobs() {
  const context = useContext(JobsContext);
  if (!context) {
    throw new Error('useJobs must be used within a JobsProvider');
  }
  return context;
}

interface JobsProviderProps {
  children: ReactNode;
}

export function JobsProvider({ children }: JobsProviderProps) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [workerStatus, setWorkerStatus] = useState<WorkerStatus | null>(null);

  // Active jobs (pending or processing)
  const activeJobs = jobs.filter(j => j.status === 'pending' || j.status === 'processing');

  // Fetch all jobs
  const refreshJobs = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/assets/jobs`);
      if (response.ok) {
        const data = await response.json();
        setJobs(data.jobs || []);
        setError(null);
      }
    } catch (err) {
      setError('Failed to fetch jobs');
    }
  }, []);

  // Create a new job
  const createJob = useCallback(async (assetId: string): Promise<Job | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/api/assets/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          asset_id: assetId,
          texture_resolution: 1024,
          device: 'cpu',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create job');
      }

      const result = await response.json();
      const newJob = result.job as Job;

      // Add to local state immediately
      setJobs(prev => [newJob, ...prev]);

      return newJob;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create job';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Clear completed/failed jobs from display
  const clearCompletedJobs = useCallback(() => {
    setJobs(prev => prev.filter(j => j.status === 'pending' || j.status === 'processing'));
  }, []);

  // Fetch worker status
  const refreshWorkerStatus = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/assets/worker/status`);
      if (response.ok) {
        const status = await response.json();
        setWorkerStatus(status);
      }
    } catch {
      // Worker status endpoint may not be available
      setWorkerStatus(null);
    }
  }, []);

  // Start worker
  const startWorker = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE}/api/assets/worker/start`, {
        method: 'POST',
      });
      if (response.ok) {
        // Refresh status after a short delay
        setTimeout(refreshWorkerStatus, 500);
        return true;
      }
    } catch {
      // Ignore errors
    }
    return false;
  }, [refreshWorkerStatus]);

  // Stop worker
  const stopWorker = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE}/api/assets/worker/stop`, {
        method: 'POST',
      });
      if (response.ok) {
        setTimeout(refreshWorkerStatus, 500);
        return true;
      }
    } catch {
      // Ignore errors
    }
    return false;
  }, [refreshWorkerStatus]);

  // Poll for updates
  useEffect(() => {
    // Initial fetch
    refreshJobs();
    refreshWorkerStatus();

    // Set up polling interval
    const pollInterval = setInterval(() => {
      refreshJobs();
      refreshWorkerStatus();
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [refreshJobs, refreshWorkerStatus]);

  const value: JobsContextValue = {
    jobs,
    activeJobs,
    isLoading,
    error,
    createJob,
    refreshJobs,
    clearCompletedJobs,
    workerStatus,
    startWorker,
    stopWorker,
  };

  return (
    <JobsContext.Provider value={value}>
      {children}
    </JobsContext.Provider>
  );
}
