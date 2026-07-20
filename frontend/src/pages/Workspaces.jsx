import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useWorkspaces } from '../hooks/useEnterprise';
import { 
  FolderOpen, Plus, X, Building2, FileText, Users, 
  Tag, Calendar, ChevronRight, Loader2, Trash2 
} from 'lucide-react';

export const Workspaces = () => {
  const { workspaces, isLoading, error, create } = useWorkspaces();
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', department: '' });
  const [creating, setCreating] = useState(false);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    setCreating(true);
    try {
      await create(formData);
      setShowCreate(false);
      setFormData({ name: '', description: '', department: '' });
    } catch (err) {
      alert(err.message);
    } finally {
      setCreating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Workspaces</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Organize documents into workspaces for scoped compliance audits
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded text-sm font-semibold hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Workspace
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl w-full max-w-md p-6 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Create Workspace</h2>
              <button onClick={() => setShowCreate(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded text-sm bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Company A - Security Policies"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded text-sm bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="What is this workspace for?"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Department</label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded text-sm bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Security, Legal, Compliance"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-700 rounded text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !formData.name.trim()}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {creating && <Loader2 className="h-4 w-4 animate-spin" />}
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Workspace Grid */}
      {workspaces.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded">
          <Building2 className="h-12 w-12 mx-auto text-slate-400 mb-3" />
          <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-400">No Workspaces Yet</h3>
          <p className="text-sm text-slate-400 mt-1">Create your first workspace to organize documents.</p>
          <button
            onClick={() => setShowCreate(true)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded text-sm font-semibold hover:bg-blue-700"
          >
            Create Workspace
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workspaces.map((ws) => (
            <Link
              key={ws._id}
              to={`/workspaces/${ws._id}`}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded p-5 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 bg-blue-50 dark:bg-blue-950/30 rounded">
                  <FolderOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
              </div>
              <h3 className="font-semibold text-sm mb-1 truncate">{ws.name}</h3>
              {ws.description && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 line-clamp-2">{ws.description}</p>
              )}
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  {ws.documentCount || 0} docs
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {ws.members?.length || 1} members
                </span>
                {ws.department && (
                  <span className="flex items-center gap-1">
                    <Tag className="h-3 w-3" />
                    {ws.department}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Workspaces;