import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useDocuments } from '../hooks/useDocuments';
import { useWorkspaces, useFrameworks, useMultiDocumentAudit, useAuditJobStatus } from '../hooks/useEnterprise';
import { 
  ShieldCheck, Loader2, CheckCircle, XCircle, 
  AlertCircle, Clock, FileText, Layers, ArrowRight,
  ExternalLink, BarChart3, Search
} from 'lucide-react';

const FRAMEWORK_EXPLANATIONS = {
  SOC2: {
    description: "SOC 2 Type II (System and Organization Controls) evaluates security, availability, processing integrity, confidentiality, and privacy controls over time.",
    whenToUse: "Auditing SaaS applications, cloud infrastructure providers, and general organizational security practices for B2B client trust.",
  },
  ISO27001: {
    description: "ISO/IEC 27001:2022 is the global standard for establishing and maintaining an Information Security Management System (ISMS).",
    whenToUse: "Assessing overall corporate information security, alignment with international standards, and enterprise compliance certifications.",
  },
  GDPR: {
    description: "The General Data Protection Regulation (GDPR) regulates data privacy and security requirements for handling personal data of EU residents.",
    whenToUse: "Auditing Data Processing Agreements (DPAs), Privacy Policies, and compliance of systems handling personal data.",
  },
  NIST: {
    description: "The NIST Cybersecurity Framework provides standards and guidelines to identify, protect, detect, respond to, and recover from cybersecurity events.",
    whenToUse: "Auditing federal systems, defense contractors, critical infrastructure, and establishing risk-based security baselines.",
  },
  PCI: {
    description: "The Payment Card Industry Data Security Standard (PCI DSS) regulates data security requirements for handling payment card transactions.",
    whenToUse: "Auditing merchant policies, transaction security, payment processors, and Cardholder Data Environments (CDE).",
  },
};

const getFrameworkExplanation = (fwKey) => {
  const norm = fwKey?.toUpperCase() || '';
  if (norm.includes('SOC2')) return FRAMEWORK_EXPLANATIONS.SOC2;
  if (norm.includes('ISO27001') || norm.includes('ISO')) return FRAMEWORK_EXPLANATIONS.ISO27001;
  if (norm.includes('GDPR')) return FRAMEWORK_EXPLANATIONS.GDPR;
  if (norm.includes('NIST')) return FRAMEWORK_EXPLANATIONS.NIST;
  if (norm.includes('PCI')) return FRAMEWORK_EXPLANATIONS.PCI;
  return null;
};

export const MultiAudit = () => {
  const [searchParams] = useSearchParams();
  const workspaceIdParam = searchParams.get('workspaceId');

  const { documents } = useDocuments();
  const { workspaces } = useWorkspaces();
  const { frameworks } = useFrameworks();
  const { runAudit, isSubmitting, result } = useMultiDocumentAudit();

  const [selectedDocs, setSelectedDocs] = useState([]);
  const [selectedFramework, setSelectedFramework] = useState('SOC2');
  const [selectedWorkspace, setSelectedWorkspace] = useState(workspaceIdParam || '');
  const [jobId, setJobId] = useState(null);
  const { job } = useAuditJobStatus(jobId);

  // Filter documents by workspace
  const filteredDocs = selectedWorkspace
    ? documents.filter(d => d.workspaceId === selectedWorkspace)
    : documents;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedDocs.length === 0) return;

    try {
      const res = await runAudit({
        documentIds: selectedDocs,
        framework: selectedFramework,
        workspaceId: selectedWorkspace || null,
      });
      setJobId(res.jobId);
    } catch (err) {
      // error handled in hook
    }
  };

  const toggleDoc = (docId) => {
    setSelectedDocs(prev =>
      prev.includes(docId) ? prev.filter(id => id !== docId) : [...prev, docId]
    );
  };

  const selectAll = () => {
    if (selectedDocs.length === filteredDocs.length) {
      setSelectedDocs([]);
    } else {
      setSelectedDocs(filteredDocs.map(d => d._id));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Multi-Document Compliance Audit</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Audit an entire workspace against a compliance framework. Evidence is combined across all selected documents.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded p-5">
            <h2 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-4">
              Audit Configuration
            </h2>

            {/* Workspace Selector */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                Workspace (optional)
              </label>
              <select
                value={selectedWorkspace}
                onChange={(e) => { setSelectedWorkspace(e.target.value); setSelectedDocs([]); }}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded text-sm bg-white dark:bg-slate-800"
              >
                <option value="">All Documents</option>
                {workspaces.map(ws => (
                  <option key={ws._id} value={ws._id}>{ws.name}</option>
                ))}
              </select>
            </div>

            {/* Framework Selector */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                Compliance Framework
              </label>
              <select
                value={selectedFramework}
                onChange={(e) => setSelectedFramework(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded text-sm bg-white dark:bg-slate-800"
              >
                {frameworks.map(fw => (
                  <option key={fw.frameworkId} value={fw.frameworkId}>{fw.name} ({fw.controlCount} controls)</option>
                ))}
              </select>
            </div>

            {getFrameworkExplanation(selectedFramework) && (
              <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-850/40 rounded border border-slate-200/60 dark:border-slate-800/80 text-[11px] space-y-2">
                <div>
                  <span className="block font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider text-[9px] mb-0.5">What is this Framework?</span>
                  <p className="text-slate-600 dark:text-slate-400 leading-normal text-justify">{getFrameworkExplanation(selectedFramework).description}</p>
                </div>
                <div>
                  <span className="block font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider text-[9px] mb-0.5">When should we use it?</span>
                  <p className="text-slate-600 dark:text-slate-400 leading-normal text-justify">{getFrameworkExplanation(selectedFramework).whenToUse}</p>
                </div>
              </div>
            )}

            {/* Selected Count */}
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded text-sm">
              <span className="font-semibold text-blue-700 dark:text-blue-400">
                {selectedDocs.length} documents selected
              </span>
              <span className="text-blue-500 dark:text-blue-300 ml-2">
                for {selectedFramework} audit
              </span>
            </div>

            <button
              onClick={handleSubmit}
              disabled={isSubmitting || selectedDocs.length === 0}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Queuing Audit...</>
              ) : (
                <><ShieldCheck className="h-4 w-4" /> Start Multi-Document Audit</>
              )}
            </button>
          </div>

          {/* Job Status */}
          {job && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded p-5">
              <h2 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-3">
                Audit Progress
              </h2>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Status</span>
                  <span className={`font-semibold flex items-center gap-1 ${
                    job.status === 'completed' ? 'text-emerald-600' :
                    job.status === 'failed' ? 'text-red-600' :
                    job.status === 'processing' ? 'text-blue-600' :
                    'text-slate-500'
                  }`}>
                    {job.status === 'completed' && <CheckCircle className="h-4 w-4" />}
                    {job.status === 'failed' && <XCircle className="h-4 w-4" />}
                    {job.status === 'processing' && <Loader2 className="h-4 w-4 animate-spin" />}
                    {job.status === 'queued' && <Clock className="h-4 w-4" />}
                    {job.status}
                  </span>
                </div>
                {job.totalControls > 0 && (
                  <>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Progress</span>
                      <span className="font-semibold">{job.progress || 0}%</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${job.progress || 0}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>{job.completedControls || 0} / {job.totalControls} controls</span>
                      <span>{job.failedControls || 0} failed</span>
                    </div>
                  </>
                )}
                {job.status === 'completed' && job.result && (
                  <div className="pt-2 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Risk Score</span>
                      <span className="font-bold">{job.result.riskScore}/100</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Compliance</span>
                      <span className="font-bold text-emerald-600">{job.result.complianceScore}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Documents</span>
                      <span className="font-bold">{job.result.documentCount}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Document Selection */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Select Documents ({filteredDocs.length} available)
              </h2>
              {filteredDocs.length > 0 && (
                <button
                  onClick={selectAll}
                  className="text-xs text-blue-500 hover:underline"
                >
                  {selectedDocs.length === filteredDocs.length ? 'Deselect All' : 'Select All'}
                </button>
              )}
            </div>

            {filteredDocs.length === 0 ? (
              <div className="p-8 text-center">
                <FileText className="h-10 w-10 mx-auto text-slate-400 mb-2" />
                <p className="text-sm text-slate-400">No documents found.</p>
                <Link to="/documents" className="text-sm text-blue-500 hover:underline mt-2 inline-block">
                  Upload Documents
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[500px] overflow-y-auto">
                {filteredDocs.map((doc) => (
                  <label
                    key={doc._id}
                    className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors ${
                      selectedDocs.includes(doc._id) ? 'bg-blue-50/50 dark:bg-blue-950/10' : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedDocs.includes(doc._id)}
                      onChange={() => toggleDoc(doc._id)}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{doc.originalName}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                        <span className={`px-1.5 py-0.5 rounded font-semibold ${
                          doc.status === 'completed' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400' :
                          'bg-slate-100 text-slate-500 dark:bg-slate-800'
                        }`}>
                          {doc.status}
                        </span>
                        <span>{doc.documentType || 'UNKNOWN'}</span>
                        {doc.totalChunks > 0 && <span>{doc.totalChunks} chunks</span>}
                      </div>
                    </div>
                    <div className="text-xs text-slate-400">
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MultiAudit;