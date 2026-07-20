import api from './axios';

/**
 * Enterprise API service - all new enterprise features
 */

// ============================================================
// Workspaces
// ============================================================

export const getWorkspaces = () => api.get('/workspaces');
export const getWorkspace = (id) => api.get(`/workspaces/${id}`);
export const createWorkspace = (data) => api.post('/workspaces', data);
export const updateWorkspace = (id, data) => api.put(`/workspaces/${id}`, data);
export const deleteWorkspace = (id) => api.delete(`/workspaces/${id}`);
export const addWorkspaceMember = (id, data) => api.post(`/workspaces/${id}/members`, data);
export const removeWorkspaceMember = (wid, mid) => api.delete(`/workspaces/${wid}/members/${mid}`);

// ============================================================
// Executive Dashboard
// ============================================================

export const getExecutiveDashboard = (workspaceId) => {
  const params = workspaceId ? { workspaceId } : {};
  return api.get('/enterprise/dashboard', { params });
};

// ============================================================
// Multi-Document Audit
// ============================================================

export const runMultiDocumentAudit = (data) => api.post('/enterprise/audit/multi', data);
export const getAuditJobs = (params) => api.get('/enterprise/audit/jobs', { params });
export const getAuditJobStatus = (jobId) => api.get(`/enterprise/audit/jobs/${jobId}`);
export const cancelAuditJob = (jobId) => api.post(`/enterprise/audit/jobs/${jobId}/cancel`);

// ============================================================
// Frameworks
// ============================================================

export const getFrameworks = () => api.get('/enterprise/frameworks');
export const getFrameworkDetails = (fw) => api.get(`/enterprise/frameworks/${fw}`);
export const seedFramework = (frameworkId) => api.post('/enterprise/frameworks/seed', { frameworkId });

// ============================================================
// Document Classification
// ============================================================

export const classifyDocument = (documentId) => api.post('/enterprise/classify', { documentId });

// ============================================================
// AI Recommendations
// ============================================================

export const getRecommendations = (assessmentId) => api.get(`/enterprise/recommendations/${assessmentId}`);

// ============================================================
// Change Impact
// ============================================================

export const getChangeImpact = (oldDocumentId, newDocumentId) =>
  api.post('/enterprise/change-impact', { oldDocumentId, newDocumentId });

// ============================================================
// Semantic Search
// ============================================================

export const semanticSearch = (params) => api.get('/enterprise/search', { params });