import { useState, useEffect, useCallback } from 'react';
import {
  getWorkspaces,
  getWorkspace,
  createWorkspace,
  getExecutiveDashboard,
  getFrameworks,
  getFrameworkDetails,
  getAuditJobs,
  getAuditJobStatus,
  runMultiDocumentAudit,
  semanticSearch,
} from '../api/enterprise';

// ============================================================
// Workspaces Hook
// ============================================================
export const useWorkspaces = () => {
  const [workspaces, setWorkspaces] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchWorkspaces = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data } = await getWorkspaces();
      setWorkspaces(data.workspaces || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchWorkspaces(); }, [fetchWorkspaces]);

  const create = async (workspaceData) => {
    try {
      const { data } = await createWorkspace(workspaceData);
      setWorkspaces((prev) => [data.workspace, ...prev]);
      return data.workspace;
    } catch (err) {
      throw new Error(err.response?.data?.message || err.message);
    }
  };

  return { workspaces, isLoading, error, refetch: fetchWorkspaces, create };
};

// ============================================================
// Single Workspace Hook
// ============================================================
export const useWorkspace = (id) => {
  const [workspace, setWorkspace] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    const fetch = async () => {
      try {
        setIsLoading(true);
        const { data } = await getWorkspace(id);
        setWorkspace(data.workspace);
        setDocuments(data.documents || []);
      } catch (err) {
        setError(err.response?.data?.message || err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, [id]);

  return { workspace, documents, isLoading, error };
};

// ============================================================
// Executive Dashboard Hook
// ============================================================
export const useExecutiveDashboard = (workspaceId = null) => {
  const [dashboard, setDashboard] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data } = await getExecutiveDashboard(workspaceId);
      setDashboard(data.dashboard);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { dashboard, isLoading, error, refetch: fetch };
};

// ============================================================
// Frameworks Hook
// ============================================================
export const useFrameworks = () => {
  const [frameworks, setFrameworks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        setIsLoading(true);
        const { data } = await getFrameworks();
        setFrameworks(data.frameworks || []);
      } catch (err) {
        setError(err.response?.data?.message || err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, []);

  return { frameworks, isLoading, error };
};

export const useFrameworkDetails = (frameworkId) => {
  const [details, setDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!frameworkId) return;
    const fetch = async () => {
      try {
        setIsLoading(true);
        const { data } = await getFrameworkDetails(frameworkId);
        setDetails(data.metadata);
      } catch (err) {
        // ignore
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, [frameworkId]);

  return { details, isLoading };
};

// ============================================================
// Audit Jobs Hook
// ============================================================
export const useAuditJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data } = await getAuditJobs({ limit: 50 });
      setJobs(data.jobs || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { jobs, isLoading, error, refetch: fetch };
};

export const useAuditJobStatus = (jobId) => {
  const [job, setJob] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!jobId) return;
    let interval;
    const fetch = async () => {
      try {
        const { data } = await getAuditJobStatus(jobId);
        setJob(data.job);
        if (data.job?.status === 'completed' || data.job?.status === 'failed') {
          clearInterval(interval);
        }
      } catch (err) {
        // ignore
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
    // Poll every 3 seconds while processing
    interval = setInterval(fetch, 3000);
    return () => clearInterval(interval);
  }, [jobId]);

  return { job, isLoading };
};

// ============================================================
// Multi-Document Audit Hook
// ============================================================
export const useMultiDocumentAudit = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const runAudit = async (data) => {
    try {
      setIsSubmitting(true);
      setError(null);
      const response = await runMultiDocumentAudit(data);
      setResult(response.data);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  return { runAudit, isSubmitting, result, error };
};

// ============================================================
// Semantic Search Hook
// ============================================================
export const useSemanticSearch = () => {
  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const search = async (params) => {
    try {
      setIsLoading(true);
      setError(null);
      const { data } = await semanticSearch(params);
      setResults(data.results || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return { results, total, isLoading, error, search };
};