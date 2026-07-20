import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useReportDetails } from '../hooks/useReports';
import { SkeletonLoader, ErrorState } from '../components/FeedbackStates';
import { 
  Printer, 
  ArrowLeft, 
  FileCheck, 
  ShieldAlert, 
  AlertTriangle,
  ClipboardList
} from 'lucide-react';

export const ReportDetails = () => {
  const { id } = useParams();
  const { report, isLoading, error, refetch } = useReportDetails(id);

  const handlePrint = () => {
    window.print();
  };

  const getRiskColor = (risk) => {
    const r = (risk || 'low').toLowerCase();
    if (r === 'high') return 'text-red-700 border-red-200 bg-red-50 dark:text-red-400 dark:border-red-900/30 dark:bg-red-950/10';
    if (r === 'medium') return 'text-amber-700 border-amber-200 bg-amber-50 dark:text-amber-400 dark:border-amber-900/30 dark:bg-amber-950/10';
    return 'text-emerald-700 border-emerald-200 bg-emerald-50 dark:text-emerald-400 dark:border-emerald-900/30 dark:bg-emerald-950/10';
  };

  if (isLoading) return <SkeletonLoader rows={4} />;
  if (error) return <ErrorState message={error.message} refetch={refetch} />;
  if (!report) return <div className="text-sm text-slate-400">Report not found.</div>;

  const { executiveSummary, overallRisk, topRisks = [], recommendations = [], assessment = {} } = report;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Navigation Toolbar */}
      <div className="flex items-center justify-between no-print border-b border-slate-200 dark:border-slate-800 pb-4">
        <Link to="/reports" className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1.5 font-semibold">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Reports List
        </Link>
        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shadow-sm transition-colors"
        >
          <Printer className="h-4 w-4" />
          Print Audit Report
        </button>
      </div>

      {/* Main Report Document Sheet */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded p-8 sm:p-12 shadow-sm card-print text-xs leading-relaxed">
        {/* Printable Header */}
        <div className="flex justify-between items-start border-b border-slate-200 dark:border-slate-800 pb-6 mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-xl font-extrabold uppercase tracking-tight text-slate-900 dark:text-white">Compliance Intelligence Report</h1>
            <p className="text-[10px] text-slate-400 uppercase font-semibold mt-1">Official security review digest</p>
          </div>
          <div className="text-right">
            <p className="font-semibold text-slate-800 dark:text-slate-300">Generated On: <span className="font-normal text-slate-500">{assessment.createdAt ? new Date(assessment.createdAt).toLocaleDateString() : "Pending"}</span></p>
            <p className="font-semibold text-slate-800 dark:text-slate-300">Framework: <span className="font-mono text-blue-600 dark:text-blue-400">{assessment.framework}</span></p>
          </div>
        </div>

        {/* Overview Box */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 border border-slate-200 dark:border-slate-800 p-5 rounded">
          <div>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Target Document</span>
            <span className="font-bold text-slate-800 dark:text-slate-200 leading-tight block">{assessment.documentId?.originalName || 'Asset Document'}</span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Compliance Status</span>
            <span className={`inline-block px-2 py-0.5 rounded font-bold uppercase ${
              assessment.assessmentStatus === 'APPLICABLE' ? 'bg-blue-50 text-blue-800 dark:bg-blue-950/20 dark:text-blue-400' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
            }`}>
              {assessment.assessmentStatus || 'COMPLETED'}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Overall Risk Level</span>
            <span className={`inline-block px-2.5 py-0.5 border rounded font-extrabold uppercase ${getRiskColor(overallRisk)}`}>
              {overallRisk || 'Low'} Risk
            </span>
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-8">
          {/* Executive Summary */}
          <section className="space-y-2">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-1.5 flex items-center gap-1.5">
              <FileCheck className="h-4 w-4 text-blue-500" />
              1. Executive Summary
            </h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-justify">
              {executiveSummary || "No executive summary provided."}
            </p>
          </section>

          {/* Top Risks */}
          <section className="space-y-3">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-1.5 flex items-center gap-1.5">
              <ShieldAlert className="h-4 w-4 text-red-500" />
              2. Key Vulnerabilities & Risks
            </h2>
            {topRisks && topRisks.length > 0 ? (
              <ul className="space-y-2">
                {topRisks.map((risk, index) => (
                  <li key={index} className="flex items-start gap-2 bg-slate-50 dark:bg-slate-800 p-3 rounded border border-slate-200 dark:border-slate-800">
                    <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed">{risk}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-400 italic">No significant vulnerabilities or policy gaps were identified during evaluation.</p>
            )}
          </section>

          {/* Recommendations */}
          <section className="space-y-3">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-1.5 flex items-center gap-1.5">
              <ClipboardList className="h-4 w-4 text-emerald-500" />
              3. Actionable Remediation Roadmap
            </h2>
            {recommendations && recommendations.length > 0 ? (
              <ul className="space-y-2">
                {recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start gap-2 bg-slate-50 dark:bg-slate-800 p-3 rounded border border-slate-200 dark:border-slate-800">
                    <div className="h-4 w-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[9px] flex-shrink-0 mt-0.5">
                      {index + 1}
                    </div>
                    <span className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed">{rec}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-400 italic">No compliance remediation tasks are currently pending.</p>
            )}
          </section>

          {/* Auditor Meta */}
          <div className="border-t border-slate-200 dark:border-slate-800 pt-8 mt-12 flex justify-between text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">
            <span>Platform: Compliance Intelligence AI v1.0</span>
            <span>Auditor Signature: Verified Secure</span>
          </div>
        </div>
      </div>
    </div>
  );
};
