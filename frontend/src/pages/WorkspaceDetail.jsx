import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useWorkspace } from '../hooks/useEnterprise';
import { 
  FolderOpen, FileText, ArrowLeft, Calendar, 
  Tag, User, ShieldCheck, Loader2, ChevronRight 
} from 'lucide-react';

export const WorkspaceDetail = () => {
  const { id } = useParams();
  const { workspace, documents, isLoading, error } = useWorkspace(id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error || !workspace) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-500">{error || 'Workspace not found'}</p>
        <Link to="/workspaces" className="text-blue-500 hover:underline mt-2 inline-block">Back to Workspaces</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link to="/workspaces" className="flex items-center gap-1 text-sm text-blue-500 hover:underline">
        <ArrowLeft className="h-4 w-4" /> Back to Workspaces
      </Link>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded">
            <FolderOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold">{workspace.name}</h1>
            {workspace.description && (
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{workspace.description}</p>
            )}
            <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <FileText className="h-3 w-3" /> {documents.length} documents
              </span>
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" /> {workspace.members?.length || 1} members
              </span>
              {workspace.department && (
                <span className="flex items-center gap-1">
                  <Tag className="h-3 w-3" /> {workspace.department}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Created {new Date(workspace.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <Link
              to={`/documents?workspaceId=${workspace._id}`}
              className="flex items-center gap-2 px-4 py-2 border border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 rounded text-sm font-semibold transition-colors"
            >
              Upload Document
            </Link>
            <Link
              to={`/multi-audit?workspaceId=${workspace._id}`}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded text-sm font-semibold hover:bg-blue-700"
            >
              <ShieldCheck className="h-4 w-4" />
              Audit Workspace
            </Link>
          </div>
        </div>
      </div>

      <h2 className="font-bold text-sm text-slate-600 dark:text-slate-400 uppercase tracking-wider">
        Documents ({documents.length})
      </h2>

      {documents.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded">
          <FileText className="h-10 w-10 mx-auto text-slate-400 mb-2" />
          <p className="text-sm text-slate-400">No documents in this workspace yet.</p>
          <Link to={`/documents?workspaceId=${workspace._id}`} className="text-sm text-blue-500 hover:underline mt-2 inline-block">
            Upload Documents
          </Link>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                <th className="p-3 font-semibold text-slate-500">Name</th>
                <th className="p-3 font-semibold text-slate-500">Type</th>
                <th className="p-3 font-semibold text-slate-500">Status</th>
                <th className="p-3 font-semibold text-slate-500">Chunks</th>
                <th className="p-3 font-semibold text-slate-500">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {documents.map((doc) => (
                <tr key={doc._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="p-3 font-medium max-w-[200px] truncate">{doc.originalName}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {doc.documentType || 'UNKNOWN'}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                      doc.status === 'completed' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400' :
                      doc.status === 'processing' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400' :
                      'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}>
                      {doc.status}
                    </span>
                  </td>
                  <td className="p-3 text-slate-500">{doc.totalChunks || 0}</td>
                  <td className="p-3 text-slate-400">{new Date(doc.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default WorkspaceDetail;