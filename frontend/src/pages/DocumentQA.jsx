import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useDocuments } from '../hooks/useDocuments';
import { useAssessments } from '../hooks/useAssessments';
import { useToast } from '../components/Toast';
import api from '../api/axios';
import { useMutation } from '@tanstack/react-query';
import { 
  FileText, 
  Send, 
  Loader2, 
  HelpCircle,
  Calendar,
  Layers,
  Database,
  ShieldCheck
} from 'lucide-react';
import { SkeletonLoader, EmptyState } from '../components/FeedbackStates';

export const DocumentQA = () => {
  const location = useLocation();
  const { documents, isLoading: loadingDocs } = useDocuments();
  const { assessments } = useAssessments();
  const { addToast } = useToast();

  const [selectedDocId, setSelectedDocId] = useState('');
  const [query, setQuery] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [selectedMessageIndex, setSelectedMessageIndex] = useState(null);

  useEffect(() => {
    if (location.state?.documentId) {
      setSelectedDocId(location.state.documentId);
    } else if (documents && documents.length > 0) {
      setSelectedDocId(documents[0]._id);
    }
  }, [location.state, documents]);

  const selectedDoc = documents.find(d => d._id === selectedDocId);

  const docAssessments = (assessments || []).filter(a => a.documentId?._id === selectedDocId);

  const askRagMutation = useMutation({
    mutationFn: async ({ query, documentId }) => {
      const response = await api.post('/rag/ask', { query, documentId });
      return response.data; // { success, answer, sources }
    },
  });

  const handleSend = async (e) => {
    e.preventDefault();
    if (!query.trim() || !selectedDocId) return;

    const userQuery = query;
    setQuery('');

    const newMsgIndex = chatHistory.length;
    setChatHistory(prev => [...prev, {
      role: 'user',
      content: userQuery,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);

    try {
      const response = await askRagMutation.mutateAsync({
        query: userQuery,
        documentId: selectedDocId
      });

      setChatHistory(prev => [...prev, {
        role: 'assistant',
        content: response.answer,
        sources: response.sources || [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
      setSelectedMessageIndex(newMsgIndex + 1);
    } catch (err) {
      addToast("Failed to fetch answers from Document Intelligence engine.", "error");
      setChatHistory(prev => [...prev, {
        role: 'assistant',
        content: "Error: Failed to retrieve evidence-based answers. Check your vector database connection.",
        sources: [],
        isError: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }
  };

  const getRiskColor = (score) => {
    if (score > 60) return 'text-red-700 bg-red-50 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30 border';
    if (score > 30) return 'text-amber-700 bg-amber-50 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30 border';
    return 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30 border';
  };

  const activeMsg = selectedMessageIndex !== null ? chatHistory[selectedMessageIndex] : null;

  return (
    <div className="space-y-6">
      {/* Header with Document Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Q&A with PDF</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Audit, search, and perform evidence-based queries against policy documents.</p>
        </div>
        <div className="w-full md:max-w-xs">
          <select
            value={selectedDocId}
            onChange={(e) => {
              setSelectedDocId(e.target.value);
              setChatHistory([]);
              setSelectedMessageIndex(null);
            }}
            className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">-- Select Investigation Target --</option>
            {documents && documents.map(doc => (
              <option key={doc._id} value={doc._id}>{doc.originalName}</option>
            ))}
          </select>
        </div>
      </div>

      {loadingDocs ? (
        <SkeletonLoader rows={4} />
      ) : !selectedDocId ? (
        <EmptyState 
          title="No document selected" 
          description="Choose an uploaded policy document from the selector at the top-right to initiate Q&A with PDF."
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Panel: Document Metadata & Audit Info */}
          <div className="space-y-6 lg:col-span-1">
            {/* Metadata Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded shadow-sm space-y-4 text-xs">
              <h2 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-slate-400" />
                Document Metadata
              </h2>
              <div className="space-y-3">
                <div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Original Name</span>
                  <span className="font-semibold text-slate-800 dark:text-white truncate block">{selectedDoc.originalName}</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Upload Date</span>
                    <span className="font-semibold text-slate-800 dark:text-white flex items-center gap-1 mt-0.5">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      {new Date(selectedDoc.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Indexed Chunks</span>
                    <span className="font-semibold text-slate-800 dark:text-white flex items-center gap-1 mt-0.5">
                      <Layers className="h-3.5 w-3.5 text-slate-400" />
                      {selectedDoc.totalChunks} chunks
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Index Sync</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                      <Database className="h-3.5 w-3.5" />
                      Vectorized
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Extraction Status</span>
                    <span className="font-semibold text-slate-800 dark:text-white capitalize block mt-0.5">
                      {selectedDoc.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Document Audits Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-805 p-5 rounded shadow-sm space-y-4 text-xs">
              <h2 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-blue-500" />
                Associated Audits
              </h2>
              {docAssessments.length > 0 ? (
                <div className="space-y-3">
                  {docAssessments.map(audit => (
                    <div key={audit._id} className="flex justify-between items-center p-2 rounded border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                      <div>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 block">{audit.framework}</span>
                        <span className="text-[10px] text-slate-400">{new Date(audit.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="text-right">
                        <span className={`inline-block px-1.5 py-0.5 rounded font-bold text-[10px] ${getRiskColor(audit.riskScore)}`}>
                          Risk: {audit.riskScore}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-slate-400 text-center py-4 italic text-[11px]">
                  No compliance frameworks analyzed yet.
                </div>
              )}
            </div>
          </div>

          {/* Right 2 Columns: Chat & Evidence */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Conversation Area */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded shadow-sm h-[480px] flex flex-col justify-between">
              
              {/* Message List */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
                {chatHistory.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500 space-y-2">
                    <HelpCircle className="h-8 w-8 text-slate-300 dark:text-slate-700" />
                    <h3 className="font-semibold text-xs text-slate-950 dark:text-slate-100">PDF Q&A Console</h3>
                    <p className="max-w-xs text-center text-[10px] leading-normal text-slate-500 dark:text-slate-400">
                      Query security policies, data storage limits, retention periods, or any controls to locate evidence in this PDF.
                    </p>
                  </div>
                ) : (
                  chatHistory.map((msg, index) => (
                    <div key={index} className={`space-y-1 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                      <div className="flex justify-between items-center px-1 text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                        <span>{msg.role === 'user' ? 'Auditor' : 'PDF Q&A Engine'}</span>
                        <span>{msg.timestamp}</span>
                      </div>
                      <div 
                        onClick={() => msg.role === 'assistant' && setSelectedMessageIndex(index)}
                        className={`p-3.5 rounded leading-relaxed inline-block max-w-[95%] text-left cursor-pointer transition-all ${
                          msg.role === 'user' 
                            ? 'bg-blue-600 text-white ml-auto block shadow-sm' 
                            : msg.isError 
                              ? 'bg-red-950/20 text-red-300 border border-red-900/30 block'
                              : `bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border block hover:border-slate-300 dark:hover:border-slate-700 ${
                                  selectedMessageIndex === index ? 'ring-1 ring-blue-500 border-blue-500 dark:border-blue-500' : 'border-slate-200 dark:border-slate-800'
                                }`
                        }`}
                      >
                        {msg.content}

                        {msg.role === 'assistant' && msg.sources && msg.sources.length > 0 && (
                          <div className="mt-2 border-t border-slate-200 dark:border-slate-800 pt-2 flex items-center justify-between text-[9px] text-slate-400">
                            <span className="font-semibold text-[9px] uppercase tracking-wider">
                              Evidence: {msg.sources.length} citations
                            </span>
                            <span className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5 font-bold">
                              Inspect Sources &rarr;
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
                {askRagMutation.isPending && (
                  <div className="flex items-center gap-2 text-slate-500 text-xs">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                    Querying vector space & drafting compliance answer...
                  </div>
                )}
              </div>

              {/* Chat Form */}
              <form onSubmit={handleSend} className="flex gap-2 border-t border-slate-100 dark:border-slate-800 pt-4 mt-4 no-print">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Enter policy investigation question..."
                  className="bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-white border border-slate-200 dark:border-slate-800 rounded px-3.5 py-2.5 flex-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={askRagMutation.isPending || !query.trim()}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded px-4 py-2 flex items-center justify-center transition-colors shadow-sm cursor-pointer"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>

            {/* Evidence Panel (Displays sources for selected message) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded shadow-sm text-xs space-y-4">
              <h2 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-1.5">
                <Database className="h-4 w-4 text-slate-400" />
                Audit Evidence Panel
              </h2>
              {activeMsg && activeMsg.sources && activeMsg.sources.length > 0 ? (
                <div className="space-y-4">
                  <p className="text-[10px] text-slate-400 italic">Retrieved sources from vector space matching query: "{activeMsg.content.substring(0, 50)}..."</p>
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                    {activeMsg.sources.map((src, sidx) => (
                      <div key={sidx} className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded p-3 space-y-2 text-xs">
                        <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-1.5 text-[9px] font-mono font-semibold uppercase text-slate-400">
                          <span>Page {src.pageNumber || 1} (Chunk #{src.chunkIndex})</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                            {Math.round((src.score || 0) * 100)}% Match
                          </span>
                        </div>
                        <p className="font-mono text-[10px] leading-relaxed text-slate-600 dark:text-slate-300 italic">
                          "{src.text || src.snippet || "Snippet content unavailable."}"
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-slate-400 text-center py-6 italic text-[11px]">
                  Click on an AI assistant response containing citations to populate references here.
                </div>
              )}
            </div>

          </div>

        </div>
      )}
    </div>
  );
};
