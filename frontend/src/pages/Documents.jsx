import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDocuments } from '../hooks/useDocuments';
import { useReports } from '../hooks/useReports';
import { useToast } from '../components/Toast';
import { useWorkspaces } from '../hooks/useEnterprise';
import { 
  UploadCloud, 
  Search, 
  FileText, 
  Play, 
  FileCheck, 
  RefreshCw, 
  Loader2,
  Trash2
} from 'lucide-react';
import { SkeletonLoader, EmptyState } from '../components/FeedbackStates';

export const Documents = () => {
  const { 
    documents, 
    isLoading, 
    uploadDocument, 
    isUploading, 
    syncDocument, 
    isSyncing,
    deleteDocument,
    isDeleting
  } = useDocuments();
  const { generateReport, isGenerating } = useReports();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const workspaceId = searchParams.get('workspaceId');
  const { workspaces } = useWorkspaces();

  const currentWorkspace = workspaces?.find(w => w._id === workspaceId);

  const [searchQuery, setSearchQuery] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [activeSyncingId, setActiveSyncingId] = useState(null);
  const [activeGeneratingId, setActiveGeneratingId] = useState(null);
  const [activeDeletingId, setActiveDeletingId] = useState(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const uploadFile = async (file) => {
    if (file.type !== "application/pdf") {
      addToast("Only PDF documents are supported.", "error");
      return;
    }
    try {
      addToast(`Uploading ${file.name}...`, "info");
      await uploadDocument({ file, workspaceId });
      addToast("Document uploaded and processed successfully", "success");
      if (workspaceId) {
        navigate(`/workspaces/${workspaceId}`);
      }
    } catch (error) {
      addToast(error.response?.data?.message || "File upload failed.", "error");
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      uploadFile(e.target.files[0]);
    }
  };

  const handleSync = async (documentId) => {
    setActiveSyncingId(documentId);
    try {
      addToast("Synchronizing vector index with Qdrant...", "info");
      await syncDocument(documentId);
      addToast("Qdrant database sync completed", "success");
    } catch (error) {
      addToast("Sync failed. Check backend configuration.", "error");
    } finally {
      setActiveSyncingId(null);
    }
  };

  const handleGenerateReport = async (documentId) => {
    setActiveGeneratingId(documentId);
    try {
      addToast("Generating compliance assessment and executive report...", "info");
      const result = await generateReport({ documentId });
      addToast("Compliance report generated successfully", "success");
      navigate(`/reports/${result.assessmentId}`);
    } catch (error) {
      addToast("Report generation failed.", "error");
    } finally {
      setActiveGeneratingId(null);
    }
  };

  const handleDelete = async (documentId) => {
    if (!window.confirm("Are you sure you want to delete this document? This will permanently remove all associated vector mappings, compliance audits, and executive reports.")) {
      return;
    }
    setActiveDeletingId(documentId);
    try {
      addToast("Deleting document and clearing related records...", "info");
      await deleteDocument(documentId);
      addToast("Document deleted successfully", "success");
    } catch (error) {
      addToast("Failed to delete document.", "error");
    } finally {
      setActiveDeletingId(null);
    }
  };

  const filteredDocs = (documents || []).filter(doc => 
    doc.originalName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Compliance Document Management</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Upload and index policy documents, audit manuals, and controls documentation.</p>
      </div>

      {currentWorkspace && (
        <div className="bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/30 rounded p-3 text-xs flex items-center justify-between text-blue-800 dark:text-blue-300">
          <span className="flex items-center gap-1.5 font-medium">
            📂 Uploading directly into workspace: <strong>{currentWorkspace.name}</strong>
          </span>
          <button 
            onClick={() => navigate('/documents')} 
            className="underline hover:text-blue-900 dark:hover:text-blue-150 font-semibold"
          >
            Switch to Global Upload
          </button>
        </div>
      )}

      {/* Drag & Drop Upload Block */}
      <div 
        onDragEnter={handleDrag} 
        onDragOver={handleDrag} 
        onDragLeave={handleDrag} 
        onDrop={handleDrop}
        className={`border border-dashed rounded p-8 text-center flex flex-col items-center justify-center transition-all ${
          dragActive 
            ? 'border-blue-500 bg-blue-50/10' 
            : 'border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900'
        }`}
      >
        {isUploading ? (
          <div className="space-y-3 py-4">
            <Loader2 className="h-8 w-8 text-blue-600 animate-spin mx-auto" />
            <h3 className="text-sm font-semibold">Extracting & Vectorizing Document...</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">PDF content is parsed by FastAPI, chunked, embedded via Gemini, and synced to MongoDB. Please wait.</p>
          </div>
        ) : (
          <>
            <UploadCloud className="h-8 w-8 text-slate-400 mb-3" />
            <h3 className="text-sm font-semibold mb-1">Drag and drop your PDF here</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">Supported formats: PDF (max 10MB)</p>
            <label className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold cursor-pointer shadow-sm transition-colors">
              Browse Files
              <input type="file" accept=".pdf" className="hidden" onChange={handleFileChange} />
            </label>
          </>
        )}
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2.5 rounded shadow-sm">
        <Search className="h-4 w-4 text-slate-400" />
        <input 
          type="text" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search uploaded policy documents..."
          className="bg-transparent text-sm w-full focus:outline-none dark:text-white"
        />
      </div>

      {/* Documents Table */}
      {isLoading ? (
        <SkeletonLoader rows={3} />
      ) : filteredDocs.length > 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="p-4">Name</th>
                  <th className="p-4">Upload Date</th>
                  <th className="p-4 text-center">Chunks</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredDocs.map((doc) => (
                  <tr key={doc._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="p-4 font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                      <FileText className="h-4 w-4 text-slate-400 flex-shrink-0" />
                      <span className="truncate max-w-[250px]">{doc.originalName}</span>
                    </td>
                    <td className="p-4 text-slate-500 dark:text-slate-400">
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-center text-slate-600 dark:text-slate-300 font-semibold">
                      {doc.totalChunks}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-semibold text-[10px] ${
                        doc.status === 'completed' 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30' 
                          : doc.status === 'failed'
                            ? 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30'
                            : 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30 animate-pulse'
                      }`}>
                        {doc.status}
                      </span>
                    </td>
                    <td className="p-4 text-right flex items-center justify-end gap-2 flex-wrap">
                      <button
                        onClick={() => navigate('/analyze', { state: { documentId: doc._id, name: doc.originalName } })}
                        className="inline-flex items-center gap-1 px-2 py-1 border border-slate-200 dark:border-slate-800 rounded hover:bg-slate-50 dark:hover:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-200 transition-colors"
                      >
                        <Play className="h-3 w-3 text-blue-500 fill-blue-500" />
                        Analyze
                      </button>

                      <button
                        disabled={isGenerating || activeGeneratingId === doc._id}
                        onClick={() => handleGenerateReport(doc._id)}
                        className="inline-flex items-center gap-1 px-2 py-1 border border-slate-200 dark:border-slate-800 rounded hover:bg-slate-50 dark:hover:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-200 disabled:opacity-50 transition-colors"
                      >
                        {isGenerating && activeGeneratingId === doc._id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <FileCheck className="h-3 w-3 text-emerald-500" />
                        )}
                        Audit Report
                      </button>

                      <button
                        disabled={isSyncing || activeSyncingId === doc._id}
                        onClick={() => handleSync(doc._id)}
                        className="inline-flex items-center gap-1 px-2 py-1 border border-slate-200 dark:border-slate-800 rounded hover:bg-slate-50 dark:hover:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300 disabled:opacity-50 transition-colors"
                        title="Force refresh database sync with Qdrant vector database"
                      >
                        {isSyncing && activeSyncingId === doc._id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <RefreshCw className="h-3 w-3 text-slate-400" />
                        )}
                        Sync DB
                      </button>

                      <button
                        disabled={isSyncing || isGenerating || activeDeletingId === doc._id}
                        onClick={() => handleDelete(doc._id)}
                        className="inline-flex items-center gap-1 px-2 py-1 border border-red-200 hover:border-red-300 dark:border-red-950 rounded hover:bg-red-50 dark:hover:bg-red-950/20 text-[11px] font-semibold text-red-650 dark:text-red-400 disabled:opacity-50 transition-colors"
                        title="Delete this document and all associated assessments/vectors"
                      >
                        {activeDeletingId === doc._id ? (
                          <Loader2 className="h-3 w-3 animate-spin text-red-500" />
                        ) : (
                          <Trash2 className="h-3 w-3 text-red-500" />
                        )}
                        Delete
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
          title="No policy documents found" 
          description={searchQuery ? "No documents match your search query." : "Upload a PDF compliance policy file above to start analyzing audits."}
        />
      )}
    </div>
  );
};
