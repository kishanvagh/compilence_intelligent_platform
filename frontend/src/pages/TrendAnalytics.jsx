import React, { useState } from 'react';
import { useTrends } from '../hooks/useTrends';
import { useDocuments } from '../hooks/useDocuments';
import { SkeletonLoader, EmptyState } from '../components/FeedbackStates';
import { RiskTrendChart } from '../components/Charts';
import { FileText, TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';

export const TrendAnalytics = () => {
  const { trends, isLoading: loadingTrends } = useTrends();
  const { documents, isLoading: loadingDocs } = useDocuments();
  const [activeFramework, setActiveFramework] = useState('SOC2');

  const isLoading = loadingTrends || loadingDocs;

  const getDocName = (docId) => {
    if (!documents) return docId;
    const doc = documents.find(d => d._id === docId);
    return doc ? doc.originalName : `Document (${docId.substring(0, 8)})`;
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'IMPROVING':
        return <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />;
      case 'DETERIORATING':
        return <TrendingDown className="h-3.5 w-3.5 text-red-500" />;
      default:
        return <Minus className="h-3.5 w-3.5 text-slate-400" />;
    }
  };

  const getTrendBadge = (trend) => {
    switch (trend) {
      case 'IMPROVING':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30';
      case 'DETERIORATING':
        return 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30';
      default:
        return 'bg-slate-50 text-slate-600 border border-slate-200 dark:bg-slate-900/20 dark:text-slate-400 dark:border-slate-800/30';
    }
  };

  const currentFrameworkData = (trends || []).find(t => t.framework === activeFramework);

  const aggregateHistory = [];
  if (currentFrameworkData?.documents) {
    currentFrameworkData.documents.forEach(doc => {
      if (doc.riskHistory) {
        doc.riskHistory.forEach(history => {
          aggregateHistory.push({
            date: history.date,
            riskScore: Number(history.riskScore || 0)
          });
        });
      }
    });
  }
  aggregateHistory.sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Compliance Trend Analytics</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Track compliance posture improvements and risk level trajectories over time.</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex gap-4">
        {['SOC2', 'ISO27001', 'GDPR'].map((fw) => (
          <button
            key={fw}
            onClick={() => setActiveFramework(fw)}
            className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
              activeFramework === fw
                ? 'border-blue-600 text-blue-600 dark:text-blue-450'
                : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            {fw === 'SOC2' ? 'SOC 2' : fw === 'ISO27001' ? 'ISO 27001' : 'GDPR'}
          </button>
        ))}
      </div>

      {isLoading ? (
        <SkeletonLoader rows={3} />
      ) : currentFrameworkData && currentFrameworkData.documents && currentFrameworkData.documents.length > 0 ? (
        <div className="space-y-8">
          {/* Main summary metric row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Audited Assets</span>
              <h3 className="text-2xl font-bold mt-1">{currentFrameworkData.documentCount}</h3>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Files analyzed under this framework</p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Improving Scopes</span>
              <h3 className="text-2xl font-bold mt-1 text-emerald-600">
                {currentFrameworkData.documents.filter(d => d.trend === 'IMPROVING').length}
              </h3>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Documents showing risk score reduction</p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Action Needed</span>
              <h3 className="text-2xl font-bold mt-1 text-red-500">
                {currentFrameworkData.documents.filter(d => d.trend === 'DETERIORATING').length}
              </h3>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Documents with increasing risk scores</p>
            </div>
          </div>

          {/* Historical line chart */}
          {aggregateHistory.length > 0 && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded shadow-sm">
              <h2 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-4 border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-1.5">
                <Info className="h-4 w-4 text-blue-500" />
                Audit Risk Trajectory (Aggregate Timeline)
              </h2>
              <RiskTrendChart data={aggregateHistory} />
            </div>
          )}

          {/* Document list details table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Document Risk Level Evolution</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="p-4">Document</th>
                    <th className="p-4 text-center">Assessments Run</th>
                    <th className="p-4 text-center">Starting Risk</th>
                    <th className="p-4 text-center">Current Risk</th>
                    <th className="p-4 text-center">Change</th>
                    <th className="p-4 text-right">Trend</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {currentFrameworkData.documents.map((doc) => (
                    <tr key={doc.documentId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="p-4 font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <FileText className="h-4 w-4 text-slate-400" />
                        <span className="truncate max-w-[250px]">{getDocName(doc.documentId)}</span>
                      </td>
                      <td className="p-4 text-center font-semibold text-slate-600 dark:text-slate-300">{doc.assessmentCount}</td>
                      <td className="p-4 text-center text-slate-500 dark:text-slate-400 font-semibold">{doc.firstRisk}</td>
                      <td className="p-4 text-center text-slate-800 dark:text-slate-200 font-bold">{doc.latestRisk}</td>
                      <td className={`p-4 text-center font-bold ${
                        doc.riskChange < 0 
                          ? 'text-emerald-600' 
                          : doc.riskChange > 0 
                            ? 'text-red-500' 
                            : 'text-slate-500'
                      }`}>
                        {doc.riskChange > 0 ? `+${doc.riskChange}` : doc.riskChange}
                      </td>
                      <td className="p-4 text-right">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-semibold text-[10px] ${getTrendBadge(doc.trend)}`}>
                          {getTrendIcon(doc.trend)}
                          {doc.trend}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <EmptyState
          title={`No trends for ${activeFramework}`}
          description={`Start by uploading a document and completing a ${activeFramework} compliance audit to generate history points.`}
        />
      )}
    </div>
  );
};
