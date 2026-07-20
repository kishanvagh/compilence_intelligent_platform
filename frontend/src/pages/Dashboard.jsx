import React from 'react';
import { Link } from 'react-router-dom';
import { useDocuments } from '../hooks/useDocuments';
import { useAssessments } from '../hooks/useAssessments';
import { useReports } from '../hooks/useReports';
import { useTrends } from '../hooks/useTrends';
import { 
  FileText, 
  ShieldCheck, 
  AlertTriangle, 
  TrendingUp, 
  ArrowUpRight
} from 'lucide-react';
import { FrameworkDistributionChart, RiskDistributionChart } from '../components/Charts';
import { CardSkeleton } from '../components/FeedbackStates';

export const Dashboard = () => {
  const { documents, isLoading: loadingDocs } = useDocuments();
  const { assessments, isLoading: loadingAssessments } = useAssessments();
  const { reports, isLoading: loadingReports } = useReports();
  const { trends, isLoading: loadingTrends } = useTrends();

  const isLoading = loadingDocs || loadingAssessments || loadingReports || loadingTrends;

  const totalDocs = documents?.length || 0;
  const totalAssessments = assessments?.length || 0;

  const avgRiskScore = totalAssessments > 0 
    ? Math.round(assessments.reduce((sum, a) => sum + Number(a.riskScore || 0), 0) / totalAssessments)
    : 0;

  const fwCounts = (assessments || []).reduce((acc, a) => {
    acc[a.framework] = (acc[a.framework] || 0) + 1;
    return acc;
  }, {});
  const frameworkData = Object.entries(fwCounts).map(([name, value]) => ({ name, value }));

  const riskGroups = (assessments || []).reduce((acc, a) => {
    const score = Number(a.riskScore || 0);
    if (score > 60) acc.High += 1;
    else if (score > 30) acc.Medium += 1;
    else acc.Low += 1;
    return acc;
  }, { Low: 0, Medium: 0, High: 0 });
  const riskData = Object.entries(riskGroups).map(([name, value]) => ({ name, value }));

  let improvingCount = 0;
  let stableCount = 0;
  let deterioratingCount = 0;
  
  if (trends && trends.length > 0) {
    trends.forEach(fw => {
      if (fw.documents) {
        fw.documents.forEach(doc => {
          if (doc.trend === 'IMPROVING') improvingCount++;
          else if (doc.trend === 'DETERIORATING') deterioratingCount++;
          else stableCount++;
        });
      }
    });
  }

  const getRiskColor = (score) => {
    if (score > 60) return 'text-red-650 bg-red-50 dark:bg-red-950/20 dark:text-red-400 border border-red-200 dark:border-red-900/30';
    if (score > 30) return 'text-amber-650 bg-amber-50 dark:bg-amber-950/20 dark:text-amber-450 border border-amber-200 dark:border-amber-900/30';
    return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30';
  };

  const getRiskLabel = (score) => {
    if (score > 60) return 'High';
    if (score > 30) return 'Medium';
    return 'Low';
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="border border-slate-200 dark:border-slate-800 rounded p-6 bg-white dark:bg-slate-900 h-80 animate-pulse"></div>
          <div className="border border-slate-200 dark:border-slate-800 rounded p-6 bg-white dark:bg-slate-900 h-80 animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">System Compliance Posture</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Real-time status of compliance reviews and risk analytics.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Documents */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Documents</span>
            <h3 className="text-2xl font-bold mt-1">{totalDocs}</h3>
            <Link to="/documents" className="text-[11px] text-blue-500 hover:underline mt-2 flex items-center gap-0.5">
              Manage Documents <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded text-slate-400 dark:text-slate-500">
            <FileText className="h-5 w-5" />
          </div>
        </div>

        {/* Card 2: Assessments */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Assessments Run</span>
            <h3 className="text-2xl font-bold mt-1">{totalAssessments}</h3>
            <Link to="/history" className="text-[11px] text-blue-500 hover:underline mt-2 flex items-center gap-0.5">
              View Audit Trails <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded text-slate-400 dark:text-slate-500">
            <ShieldCheck className="h-5 w-5" />
          </div>
        </div>

        {/* Card 3: Avg Risk Score */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Avg Risk Score</span>
            <div className="flex items-baseline gap-2 mt-1">
              <h3 className="text-2xl font-bold">{avgRiskScore}</h3>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${getRiskColor(avgRiskScore)}`}>
                {getRiskLabel(avgRiskScore)}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2">Lower score is safer</p>
          </div>
          <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded text-slate-400 dark:text-slate-500">
            <AlertTriangle className="h-5 w-5" />
          </div>
        </div>

        {/* Card 4: Trends status */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Security Trend</span>
            <h3 className="text-base font-bold mt-1 truncate">
              {improvingCount > deterioratingCount ? 'Improving' : deterioratingCount > 0 ? 'Needs Attention' : 'Stable'}
            </h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2 truncate">
              {improvingCount} better | {deterioratingCount} worse
            </p>
          </div>
          <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded text-slate-400 dark:text-slate-500">
            <TrendingUp className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded p-5 shadow-sm">
          <h2 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">
            Assessment Framework Distribution
          </h2>
          {frameworkData.length > 0 ? (
            <FrameworkDistributionChart data={frameworkData} />
          ) : (
            <div className="h-[250px] flex items-center justify-center text-xs text-slate-400">
              No audits completed yet.
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded p-5 shadow-sm">
          <h2 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">
            Risk Profile Distribution
          </h2>
          {assessments.length > 0 ? (
            <RiskDistributionChart data={riskData} />
          ) : (
            <div className="h-[250px] flex items-center justify-center text-xs text-slate-400">
              No audits completed yet.
            </div>
          )}
        </div>
      </div>

      {/* Tables grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent assessments */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded shadow-sm">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Recent Assessments
            </h2>
            <Link to="/history" className="text-xs text-blue-500 hover:underline">
              View All
            </Link>
          </div>
          <div className="overflow-x-auto">
            {assessments && assessments.length > 0 ? (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="p-3">Document</th>
                    <th className="p-3">Framework</th>
                    <th className="p-3 text-center">Risk Score</th>
                    <th className="p-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {assessments.slice(0, 5).map((a) => (
                    <tr key={a._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="p-3 font-semibold text-slate-700 dark:text-slate-200 max-w-[150px] truncate">
                        <Link to={`/assessments/${a._id}`} className="hover:text-blue-500">
                          {a.documentId?.originalName || 'Document'}
                        </Link>
                      </td>
                      <td className="p-3 font-semibold text-slate-600 dark:text-slate-300">{a.framework}</td>
                      <td className="p-3 text-center">
                        <span className={`inline-block px-1.5 py-0.5 rounded font-bold ${getRiskColor(a.riskScore)}`}>
                          {a.riskScore}
                        </span>
                      </td>
                      <td className="p-3 text-slate-400 dark:text-slate-500">
                        {new Date(a.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-6 text-center text-xs text-slate-400">
                No assessments run yet. Upload a document to get started.
              </div>
            )}
          </div>
        </div>

        {/* Recent reports */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded shadow-sm">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Recent Reports
            </h2>
            <Link to="/reports" className="text-xs text-blue-500 hover:underline">
              View All
            </Link>
          </div>
          <div className="overflow-x-auto">
            {reports && reports.length > 0 ? (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="p-3">Document</th>
                    <th className="p-3">Framework</th>
                    <th className="p-3 text-center">Risk Level</th>
                    <th className="p-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {reports.slice(0, 5).map((r) => (
                    <tr key={r._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="p-3 font-semibold text-slate-700 dark:text-slate-200 max-w-[150px] truncate">
                        <Link to={`/reports/${r._id}`} className="hover:text-blue-500">
                          {r.documentId?.originalName || 'Document'}
                        </Link>
                      </td>
                      <td className="p-3 font-semibold text-slate-600 dark:text-slate-300">{r.framework}</td>
                      <td className="p-3 text-center">
                        <span className={`inline-block px-1.5 py-0.5 rounded font-bold ${
                          r.report?.overallRisk?.toLowerCase() === 'high' ? 'bg-red-50 text-red-750 border border-red-200 dark:bg-red-950/10 dark:text-red-400 dark:border-red-900/30' :
                          r.report?.overallRisk?.toLowerCase() === 'medium' ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/10 dark:text-amber-400 dark:border-amber-900/30' :
                          'bg-emerald-50 text-emerald-750 border border-emerald-200 dark:bg-emerald-950/10 dark:text-emerald-400 dark:border-emerald-900/30'
                        }`}>
                          {r.report?.overallRisk || 'Low'}
                        </span>
                      </td>
                      <td className="p-3 text-slate-400 dark:text-slate-500">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-6 text-center text-xs text-slate-400">
                No reports generated yet. Generate a report from the Documents tab.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
