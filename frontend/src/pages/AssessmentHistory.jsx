import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAssessments } from '../hooks/useAssessments';
import { Search, Filter, ShieldCheck, ArrowRight } from 'lucide-react';
import { SkeletonLoader, EmptyState } from '../components/FeedbackStates';

export const AssessmentHistory = () => {
  const { assessments, isLoading } = useAssessments();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFramework, setSelectedFramework] = useState('ALL');
  const [selectedRisk, setSelectedRisk] = useState('ALL');

  const getRiskLabel = (score) => {
    if (score > 60) return 'High';
    if (score > 30) return 'Medium';
    return 'Low';
  };

  const getRiskColor = (score) => {
    if (score > 60) return 'text-red-750 bg-red-50 dark:bg-red-950/20 dark:text-red-400 border border-red-200';
    if (score > 30) return 'text-amber-700 bg-amber-50 dark:bg-amber-950/20 dark:text-amber-450 border border-amber-200';
    return 'text-emerald-750 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-200';
  };

  const filteredAssessments = (assessments || []).filter(a => {
    const docName = a.documentId?.originalName || '';
    const matchesSearch = docName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          a.framework.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFramework = selectedFramework === 'ALL' || a.framework === selectedFramework;
    
    const riskLabel = getRiskLabel(a.riskScore).toUpperCase();
    const matchesRisk = selectedRisk === 'ALL' || riskLabel === selectedRisk;

    return matchesSearch && matchesFramework && matchesRisk;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Audit & Assessment History</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Review historical compliance evaluations, status histories, and evidence mappings.</p>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="flex items-center gap-2 border border-slate-200 dark:border-slate-800 rounded px-3 py-1.5 w-full md:max-w-xs bg-slate-50 dark:bg-slate-800">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by policy or framework..."
            className="bg-transparent text-xs focus:outline-none w-full dark:text-white"
          />
        </div>

        {/* Dropdown filters */}
        <div className="flex gap-4 w-full md:w-auto items-center">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Filter className="h-3.5 w-3.5" />
            <span>Filters:</span>
          </div>

          <select
            value={selectedFramework}
            onChange={(e) => setSelectedFramework(e.target.value)}
            className="text-xs px-2.5 py-1.5 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 rounded focus:outline-none"
          >
            <option value="ALL">All Frameworks</option>
            <option value="SOC2">SOC 2</option>
            <option value="ISO27001">ISO 27001</option>
            <option value="GDPR">GDPR</option>
          </select>

          <select
            value={selectedRisk}
            onChange={(e) => setSelectedRisk(e.target.value)}
            className="text-xs px-2.5 py-1.5 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 rounded focus:outline-none"
          >
            <option value="ALL">All Risks</option>
            <option value="LOW">Low Risk</option>
            <option value="MEDIUM">Medium Risk</option>
            <option value="HIGH">High Risk</option>
          </select>
        </div>
      </div>

      {/* History table list */}
      {isLoading ? (
        <SkeletonLoader rows={4} />
      ) : filteredAssessments.length > 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="p-4">Policy Document</th>
                  <th className="p-4">Framework</th>
                  <th className="p-4 text-center">Controls Complied</th>
                  <th className="p-4 text-center">Risk Score</th>
                  <th className="p-4">Assessed Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredAssessments.map((a) => (
                  <tr key={a._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="p-4 font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-blue-500" />
                      <span className="truncate max-w-[200px]">{a.documentId?.originalName || 'Deleted Document'}</span>
                    </td>
                    <td className="p-4 font-semibold text-slate-600 dark:text-slate-300">{a.framework}</td>
                    <td className="p-4 text-center">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{a.compliantControls}</span>
                      <span className="text-slate-400 text-[10px]"> / {a.totalControls}</span>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded font-bold ${getRiskColor(a.riskScore)}`}>
                        {a.riskScore}
                      </span>
                    </td>
                    <td className="p-4 text-slate-400 dark:text-slate-500">
                      {new Date(a.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => navigate(`/assessments/${a._id}`)}
                        className="inline-flex items-center gap-1 text-blue-500 hover:text-blue-700 font-semibold transition-colors"
                      >
                        Inspect
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
          title="No assessments found"
          description="Try adjusting your filters or complete a new assessment from the Documents tab."
        />
      )}
    </div>
  );
};
