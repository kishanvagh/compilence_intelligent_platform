import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useDocuments } from '../hooks/useDocuments';
import { useAssessments } from '../hooks/useAssessments';
import { useToast } from '../components/Toast';
import { 
  Loader2, 
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const FRAMEWORK_EXPLANATIONS = {
  SOC2: {
    name: "SOC 2 Type II",
    description: "SOC 2 Type II (System and Organization Controls) is a framework developed by the AICPA to evaluate an organization's security controls over a period of time. It assesses controls based on the Trust Services Criteria (Security, Availability, Processing Integrity, Confidentiality, and Privacy).",
    whenToUse: "Use this framework when auditing vendor management policies, SaaS applications, cloud infrastructure providers, and general organizational security practices. It is the gold standard for verifying security compliance to B2B customers and enterprise clients in North America.",
  },
  ISO27001: {
    name: "ISO/IEC 27001:2022",
    description: "ISO/IEC 27001:2022 is the premier international standard for establishing, implementing, operating, maintaining, and continually improving an Information Security Management System (ISMS). It provides a systematic approach to managing sensitive company information.",
    whenToUse: "Use this framework when assessing overall information security management systems, preparing for global ISO certifications, evaluating corporate governance policies, or aligning international branches under a unified risk management framework.",
  },
  GDPR: {
    name: "GDPR (General Data Protection Regulation)",
    description: "The General Data Protection Regulation (GDPR) is a comprehensive data privacy law in the European Union that regulates how personal data of EU citizens is processed, stored, and protected. It carries heavy penalties for non-compliance.",
    whenToUse: "Use this framework when auditing Data Protection Policies, Data Processing Agreements (DPAs), Privacy Policies, and any corporate documentation concerning the collection, storage, transfer, or usage of personal data belonging to EU residents.",
  },
  NIST: {
    name: "NIST CSF (Cybersecurity Framework)",
    description: "The NIST Cybersecurity Framework (CSF) is a set of guidelines and standards developed by the National Institute of Standards and Technology to help organizations identify, protect, detect, respond to, and recover from cyber attacks.",
    whenToUse: "Use this framework when auditing federal agencies, aerospace/defense contractors, critical infrastructure organizations, or companies looking to establish a standardized, risk-based cybersecurity posture mapped to US standards.",
  },
  PCI: {
    name: "PCI DSS (Payment Card Industry Data Security Standard)",
    description: "The Payment Card Industry Data Security Standard (PCI DSS) is a set of security standards designed to ensure that all companies that accept, process, store, or transmit credit card information maintain a secure environment.",
    whenToUse: "Use this framework when auditing Cardholder Data Environments (CDE), payment gateway procedures, merchant agreements, point-of-sale security policies, and any document governing credit/debit card transactions.",
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

export const AnalyzeDocument = () => {
  const location = useLocation();
  const { documents } = useDocuments();
  const { analyzeDocument, isAnalyzing } = useAssessments();
  const { addToast } = useToast();

  const [selectedDocId, setSelectedDocId] = useState('');
  const [selectedFramework, setSelectedFramework] = useState('SOC2');
  const [result, setResult] = useState(null);
  const [expandedControlId, setExpandedControlId] = useState(null);

  useEffect(() => {
    if (location.state?.documentId) {
      setSelectedDocId(location.state.documentId);
    } else if (documents && documents.length > 0) {
      setSelectedDocId(documents[0]._id);
    }
  }, [location.state, documents]);

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!selectedDocId) {
      addToast("Please select a document.", "error");
      return;
    }
    setResult(null);
    try {
      addToast(`Analyzing compliance against ${selectedFramework}...`, "info");
      const assessment = await analyzeDocument({
        documentId: selectedDocId,
        framework: selectedFramework
      });
      setResult(assessment);
      addToast("Compliance analysis complete", "success");
    } catch (error) {
      addToast(error.response?.data?.message || "Analysis failed. Please try again.", "error");
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'COMPLIANT':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30';
      case 'PARTIALLY_COMPLIANT':
        return 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30';
      case 'NON_COMPLIANT':
        return 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30';
      default:
        return 'bg-slate-50 text-slate-600 border border-slate-200 dark:bg-slate-900/20 dark:text-slate-400 dark:border-slate-800/30';
    }
  };

  const getRiskColor = (score) => {
    if (score > 60) return 'text-red-700 bg-red-50 dark:bg-red-950/20 dark:text-red-400 border border-red-200';
    if (score > 30) return 'text-amber-700 bg-amber-50 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-200';
    return 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-200';
  };

  const currentExplanation = getFrameworkExplanation(selectedFramework);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Run Compliance Assessment</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Audit selected documents against core regulatory compliance frameworks.</p>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded shadow-sm space-y-5">
        <form onSubmit={handleAnalyze} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          <div>
            <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
              Select Document
            </label>
            <select
              value={selectedDocId}
              onChange={(e) => setSelectedDocId(e.target.value)}
              className="w-full text-sm px-3 py-2 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">-- Choose a document --</option>
              {documents && documents.map(doc => (
                <option key={doc._id} value={doc._id}>{doc.originalName}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
              Select Framework
            </label>
            <select
              value={selectedFramework}
              onChange={(e) => setSelectedFramework(e.target.value)}
              className="w-full text-sm px-3 py-2 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="SOC2">SOC 2 Type II</option>
              <option value="ISO27001">ISO/IEC 27001:2022</option>
              <option value="GDPR">GDPR (General Data Protection Regulation)</option>
              <option value="NIST">NIST CSF (Cybersecurity Framework)</option>
              <option value="PCI">PCI DSS (Payment Card Industry DSS)</option>
            </select>
          </div>

          <div>
            <button
              type="submit"
              disabled={isAnalyzing || !selectedDocId}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded py-2 text-sm font-semibold flex items-center justify-center gap-2 shadow-sm transition-colors"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Auditing Document...
                </>
              ) : (
                'Execute Audit'
              )}
            </button>
          </div>
        </form>

        {currentExplanation && (
          <div className="pt-4 border-t border-slate-150 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded border border-slate-200/60 dark:border-slate-800/85">
              <span className="block font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider text-[9px] mb-1">What is this Framework?</span>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-justify">{currentExplanation.description}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded border border-slate-200/60 dark:border-slate-800/85">
              <span className="block font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider text-[9px] mb-1">When should we use this Framework?</span>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-justify">{currentExplanation.whenToUse}</p>
            </div>
          </div>
        )}
      </div>

      {result && (
        <div className="space-y-6">
          {/* Assessment Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Overall Risk Score</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-extrabold">{result.riskScore}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${getRiskColor(result.riskScore)}`}>
                  {result.riskScore > 60 ? 'High' : result.riskScore > 30 ? 'Medium' : 'Low'}
                </span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Compliant Controls</span>
              <div className="flex items-baseline gap-2 mt-2 text-emerald-600 dark:text-emerald-400">
                <span className="text-3xl font-extrabold">{result.compliantControls}</span>
                <span className="text-xs">/ {result.totalControls}</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Partial / Non-Compliant</span>
              <div className="flex items-baseline gap-3 mt-2">
                <span className="text-3xl font-extrabold text-amber-500">{result.partialControls}</span>
                <span className="text-xs text-slate-400">partial</span>
                <span className="text-3xl font-extrabold text-red-500">{result.nonCompliantControls}</span>
                <span className="text-xs text-slate-400">non-compliant</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Audit Status</span>
              <div className="mt-2.5">
                <span className={`inline-block px-2.5 py-1 rounded font-bold text-xs ${
                  result.assessmentStatus === 'APPLICABLE' ? 'bg-blue-50 text-blue-800 dark:bg-blue-950/20 dark:text-blue-400 border border-blue-200' : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border border-slate-250'
                }`}>
                  {result.assessmentStatus}
                </span>
              </div>
            </div>
          </div>

          {/* Controls table list */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Evaluated Framework Controls</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="p-4 w-[100px]">ID</th>
                    <th className="p-4">Control Name</th>
                    <th className="p-4 w-[150px]">Status</th>
                    <th className="p-4 w-[120px] text-center">Confidence</th>
                    <th className="p-4 w-[60px]"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {result.controls && result.controls.map((control) => {
                    const isExpanded = expandedControlId === control.controlId;
                    return (
                      <React.Fragment key={control.controlId}>
                        <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 cursor-pointer" onClick={() => setExpandedControlId(isExpanded ? null : control.controlId)}>
                          <td className="p-4 font-mono font-bold text-blue-600 dark:text-blue-400">{control.controlId}</td>
                          <td className="p-4 font-semibold text-slate-800 dark:text-slate-200">{control.controlName}</td>
                          <td className="p-4">
                            <span className={`inline-block px-2 py-0.5 rounded font-semibold text-[10px] ${getStatusBadge(control.status)}`}>
                              {control.status}
                            </span>
                          </td>
                          <td className="p-4 text-center font-semibold text-slate-600 dark:text-slate-400">
                            {Math.round((control.confidence || 0) * 100)}%
                          </td>
                          <td className="p-4 text-right">
                            {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className="bg-slate-50/50 dark:bg-slate-900/40">
                            <td colSpan="5" className="p-5 border-t border-slate-100 dark:border-slate-800 space-y-4 text-xs">
                              <div>
                                <h4 className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-1">Audit Evidence Found</h4>
                                <p className="text-slate-700 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-900 p-3 rounded border border-slate-200 dark:border-slate-800">
                                  {control.evidence || "No explicit audit evidence was identified in the policy documentation."}
                                </p>
                              </div>

                              {control.status !== 'COMPLIANT' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <h4 className="font-bold text-amber-600 dark:text-amber-450 uppercase tracking-wider text-[10px] mb-1">Identified Policy Gap</h4>
                                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-900 p-3 rounded border border-slate-200 dark:border-slate-800">
                                      {control.gap || "Missing explicit procedural implementation definitions."}
                                    </p>
                                  </div>
                                  <div>
                                    <h4 className="font-bold text-blue-600 dark:text-blue-500 uppercase tracking-wider text-[10px] mb-1">Remediation Recommendation</h4>
                                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-900 p-3 rounded border border-slate-200 dark:border-slate-800">
                                      {control.recommendation || "Amend document to explicitly document compliance procedures."}
                                    </p>
                                  </div>
                                </div>
                              )}
                              
                              {control.sourceChunks && control.sourceChunks.length > 0 && (
                                <div>
                                  <h4 className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-1">Referenced Policy Snippets</h4>
                                  <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                                    {control.sourceChunks.map((chunk, cidx) => {
                                      const isObject = typeof chunk === 'object' && chunk !== null;
                                      const labelText = isObject 
                                        ? `Page ${chunk.pageNumber || 1} (Chunk ${chunk.chunkIndex})` 
                                        : chunk;
                                      const bodyText = isObject ? chunk.text : '';
                                      return (
                                        <div key={cidx} className="bg-slate-50 dark:bg-slate-800 p-2.5 rounded border border-slate-200 dark:border-slate-800 space-y-1">
                                          <span className="font-bold text-[9px] text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
                                            {labelText}
                                          </span>
                                          {bodyText ? (
                                            <p className="font-mono text-[10px] leading-normal text-slate-600 dark:text-slate-300 italic">
                                              "{bodyText}"
                                            </p>
                                          ) : (
                                            <p className="font-mono text-[10px] leading-normal text-slate-600 dark:text-slate-300 italic">
                                              "{chunk}"
                                            </p>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
