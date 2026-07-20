import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReports } from '../hooks/useReports';
import { BookOpen, Search, ArrowRight } from 'lucide-react';
import { SkeletonLoader, EmptyState } from '../components/FeedbackStates';

export const Reports = () => {
  const { reports, isLoading } = useReports();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredReports = (reports || []).filter(r => {
    const docName = r.documentId?.originalName || '';
    return docName.toLowerCase().includes(searchQuery.toLowerCase()) ||
           r.framework.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const getRiskColor = (risk) => {
    const r = (risk || 'low').toLowerCase();
    if (r === 'high') return 'text-red-700 bg-red-50 dark:bg-red-950/20 dark:text-red-400 border border-red-200';
    if (r === 'medium') return 'text-amber-700 bg-amber-50 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-200';
    return 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-200';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Compliance Executive Reports</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Review executive-level compliance posture digests, top risks, and auditor actions.</p>
      </div>

      {/* Toolbar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded shadow-sm">
        <div className="flex items-center gap-2 border border-slate-200 dark:border-slate-800 rounded px-3 py-1.5 w-full md:max-w-xs bg-slate-50 dark:bg-slate-800">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search reports by filename..."
            className="bg-transparent text-xs focus:outline-none w-full dark:text-white"
          />
        </div>
      </div>

      {/* Reports List Table */}
      {isLoading ? (
        <SkeletonLoader rows={3} />
      ) : filteredReports.length > 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="p-4">Audited File</th>
                  <th className="p-4">Framework</th>
                  <th className="p-4 text-center">Risk Rating</th>
                  <th className="p-4">Generated On</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredReports.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="p-4 font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-blue-500" />
                      <span className="truncate max-w-[250px]">{r.documentId?.originalName || 'Deleted Document'}</span>
                    </td>
                    <td className="p-4 font-semibold text-slate-600 dark:text-slate-300">{r.framework}</td>
                    <td className="p-4 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded font-bold ${getRiskColor(r.report?.overallRisk)}`}>
                        {r.report?.overallRisk || 'Low'}
                      </span>
                    </td>
                    <td className="p-4 text-slate-400 dark:text-slate-500">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => navigate(`/reports/${r._id}`)}
                        className="inline-flex items-center gap-1 text-blue-500 hover:text-blue-700 font-semibold transition-colors"
                      >
                        Open Executive View
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState
          title="No compliance reports found"
          description="Go to the Documents tab and click 'Audit Report' on any completed policy to generate one."
        />
      )}
    </div>
  );
};
