import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAssessmentDetails } from '../hooks/useAssessments';
import { 
  ChevronDown, 
  ChevronUp, 
  Send, 
  FileText, 
  HelpCircle,
  Loader2
} from 'lucide-react';
import { SkeletonLoader, ErrorState } from '../components/FeedbackStates';

export const AssessmentDetails = () => {
  const { id } = useParams();
  const { assessment, isLoading, error, refetch, askQuestion, isAsking } = useAssessmentDetails(id);
  const [expandedControlId, setExpandedControlId] = useState(null);

  const [ragQuery, setRagQuery] = useState('');
  const [ragConversations, setRagConversations] = useState([]);

  const handleAskQuestion = async (e) => {
    e.preventDefault();
    if (!ragQuery.trim()) return;

    const currentQuery = ragQuery;
    setRagQuery('');
    
    setRagConversations(prev => [...prev, { role: 'user', content: currentQuery }]);

    try {
      const response = await askQuestion({
        query: currentQuery,
        documentId: assessment.documentId?._id
      });
      setRagConversations(prev => [...prev, { 
        role: 'assistant', 
        content: response.answer,
        sources: response.sources
      }]);
    } catch (err) {
      setRagConversations(prev => [...prev, { 
        role: 'assistant', 
        content: "Error: Failed to fetch answer from RAG engine. Check backend logs.",
        isError: true 
      }]);
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

  if (isLoading) return <SkeletonLoader rows={4} />;
  if (error) return <ErrorState message={error.message} refetch={refetch} />;
  if (!assessment) return <div className="text-sm text-slate-400">Assessment not found.</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left 2 Columns: Audit details */}
      <div className="lg:col-span-2 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Audit Assessment Report</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-slate-400" />
              Document: <span className="font-semibold text-slate-800 dark:text-white">{assessment.documentId?.originalName}</span>
            </p>
          </div>
          <div>
            <Link to="/history" className="text-xs text-blue-500 hover:underline">
              &larr; Back to History
            </Link>
          </div>
        </div>

        {/* Audit Meta Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Framework</span>
            <p className="text-xs font-bold mt-0.5 text-slate-800 dark:text-white">{assessment.framework}</p>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Classification</span>
            <p className="text-xs font-bold mt-0.5 text-slate-800 dark:text-white truncate">{assessment.documentType || 'General Policy'}</p>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Risk Index</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xs font-bold text-slate-800 dark:text-white">{assessment.riskScore}</span>
              <span className={`text-[9px] px-1 rounded font-bold ${getRiskColor(assessment.riskScore)}`}>
                {assessment.riskScore > 60 ? 'High' : assessment.riskScore > 30 ? 'Medium' : 'Low'}
              </span>
            </div>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Audited On</span>
            <p className="text-xs font-bold mt-0.5 text-slate-800 dark:text-white">{new Date(assessment.createdAt).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Controls evaluation */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Evaluated Controls Details</h2>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {assessment.controls && assessment.controls.map((control) => {
              const isExpanded = expandedControlId === control.controlId;
              return (
                <div key={control.controlId} className="transition-colors duration-150">
                  <div 
                    onClick={() => setExpandedControlId(isExpanded ? null : control.controlId)}
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/30 text-xs"
                  >
                    <div className="flex items-center gap-4 min-w-0 pr-4">
                      <span className="font-mono font-bold text-blue-600 dark:text-blue-450 flex-shrink-0">{control.controlId}</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">{control.controlName}</span>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className={`px-2 py-0.5 rounded font-semibold text-[10px] ${getStatusBadge(control.status)}`}>
                        {control.status}
                      </span>
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="p-5 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 space-y-4 text-xs">
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

                      <div>
                        <h4 className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-1">Confidence Score</h4>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden max-w-[150px]">
                            <div className="bg-blue-600 h-full rounded-full" style={{ width: `${(control.confidence || 0.5) * 100}%` }}></div>
                          </div>
                          <span className="font-semibold text-slate-600 dark:text-slate-400">{Math.round((control.confidence || 0.5) * 100)}%</span>
                        </div>
                      </div>
                      
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
                                          <span className="font-bold text-[9px] text-blue-600 dark:text-blue-450 uppercase tracking-wider block">
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
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right Column: Q&A Assistant */}
      <div className="space-y-6">
        <div className="bg-slate-900 text-slate-300 border border-slate-800 p-5 rounded shadow-sm h-[600px] flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2 mb-4 flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-blue-500" />
              Compliance Q&A Assistant
            </h2>
            <p className="text-[10px] text-slate-400 mb-4">Ask policy-related audit questions directly to the document using retrieval augmented generation (RAG).</p>

            {/* Conversation Flow */}
            <div className="space-y-4 overflow-y-auto max-h-[380px] pr-1">
              {ragConversations.length === 0 ? (
                <div className="text-center text-slate-500 py-12 text-xs">
                  Ask a question to start. E.g. "What is the policy for multi-factor authentication?"
                </div>
              ) : (
                ragConversations.map((msg, idx) => (
                  <div key={idx} className={`space-y-1.5 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">
                      {msg.role === 'user' ? 'Auditor' : 'AI Assistant'}
                    </span>
                    <div className={`p-3 rounded text-xs leading-relaxed inline-block max-w-[95%] text-left ${
                      msg.role === 'user' 
                        ? 'bg-blue-600 text-white ml-auto block' 
                        : msg.isError 
                          ? 'bg-red-950/20 text-red-300 border border-red-900/30 block'
                          : 'bg-slate-800 text-slate-200 border border-slate-800 block'
                    }`}>
                      {msg.content}
                    </div>

                    {msg.sources && msg.sources.length > 0 && (
                      <div className="text-left bg-slate-950 p-2 rounded border border-slate-800 text-[10px] space-y-1 max-w-[95%]">
                        <span className="font-bold text-slate-500 uppercase text-[8px] tracking-wider block">Sources:</span>
                        {msg.sources.map((src, sidx) => {
                          const isObject = typeof src === 'object' && src !== null;
                          const label = isObject 
                            ? `Page ${src.pageNumber || 1} (Chunk ${src.chunkIndex})` 
                            : `Chunk #${sidx + 1}`;
                          const body = isObject ? src.text || src.snippet : src;
                          return (
                            <div key={sidx} className="border-b border-slate-800/50 pb-1 last:border-b-0 space-y-0.5">
                              <span className="text-[8px] text-blue-400 font-bold block">{label}</span>
                              <p className="italic text-slate-400 font-mono line-clamp-2" title={body}>
                                "{body}"
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))
              )}
              {isAsking && (
                <div className="flex items-center gap-2 text-slate-500 text-xs">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                  Generating answer from vector database...
                </div>
              )}
            </div>
          </div>

          <form onSubmit={handleAskQuestion} className="flex gap-2 border-t border-slate-800 pt-4 mt-4">
            <input
              type="text"
              value={ragQuery}
              onChange={(e) => setRagQuery(e.target.value)}
              placeholder="Ask document specific audits..."
              className="bg-slate-800 text-xs text-white border border-slate-800 rounded px-3 py-2 flex-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={isAsking || !ragQuery.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded p-2 flex items-center justify-center transition-colors"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
