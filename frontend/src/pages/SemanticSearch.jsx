import React, { useState } from 'react';
import { useSemanticSearch, useWorkspaces } from '../hooks/useEnterprise';
import { Search, FileText, Loader2, ArrowUpRight, BookOpen, Tag, Calendar, ChevronDown } from 'lucide-react';

export const SemanticSearchPage = () => {
  const { results, total, isLoading, error, search } = useSemanticSearch();
  const { workspaces } = useWorkspaces();
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({
    workspaceId: '',
    tags: '',
    department: '',
    startDate: '',
    endDate: '',
    limit: 20,
    offset: 0,
  });
  const [showFilters, setShowFilters] = useState(false);

  const handleSearch = (e) => {
    e?.preventDefault();
    if (!query.trim()) return;
    const params = { query, ...filters };
    if (!params.workspaceId) delete params.workspaceId;
    if (!params.tags) delete params.tags;
    if (!params.department) delete params.department;
    if (!params.startDate) delete params.startDate;
    if (!params.endDate) delete params.endDate;
    search(params);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Semantic Search</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Search across all uploaded documents with AI-powered results
        </p>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="relative">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search across all documents..."
              className="w-full pl-10 pr-4 py-3 border border-slate-300 dark:border-slate-700 rounded text-sm bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="px-6 py-3 bg-blue-600 text-white rounded text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Search
          </button>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="px-3 py-3 border border-slate-300 dark:border-slate-700 rounded text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-3 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Workspace</label>
              <select
                value={filters.workspaceId}
                onChange={(e) => setFilters({ ...filters, workspaceId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded text-sm bg-white dark:bg-slate-800"
              >
                <option value="">All Workspaces</option>
                {workspaces.map(ws => (
                  <option key={ws._id} value={ws._id}>{ws.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Tags</label>
              <input
                type="text"
                value={filters.tags}
                onChange={(e) => setFilters({ ...filters, tags: e.target.value })}
                placeholder="comma, separated"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded text-sm bg-white dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Department</label>
              <input
                type="text"
                value={filters.department}
                onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                placeholder="e.g., Security"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded text-sm bg-white dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">From Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded text-sm bg-white dark:bg-slate-800"
              />
            </div>
          </div>
        )}
      </form>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Found <span className="font-semibold text-slate-700 dark:text-slate-300">{total}</span> results
          </p>
        </div>
      )}

      <div className="space-y-3">
        {results.map((result, idx) => (
          <div
            key={`${result.documentId}-${result.chunkIndex}-${idx}`}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded p-4 hover:shadow-sm transition-shadow"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-500" />
                <span className="font-semibold text-sm">{result.documentName}</span>
              </div>
              <div className="flex items-center gap-2">
                {result.score && (
                  <span className="text-xs text-slate-400">
                    Score: {(result.score * 100).toFixed(1)}%
                  </span>
                )}
                <span className="text-xs text-slate-400">
                  Page {result.pageNumber}
                </span>
              </div>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2 line-clamp-4">
              {result.text}
            </p>

            <div className="flex items-center gap-3 text-xs text-slate-400">
              {result.documentType && (
                <span className="flex items-center gap-1">
                  <BookOpen className="h-3 w-3" />
                  {result.documentType}
                </span>
              )}
              {result.tags?.length > 0 && (
                <span className="flex items-center gap-1">
                  <Tag className="h-3 w-3" />
                  {result.tags.join(', ')}
                </span>
              )}
              {result.department && (
                <span className="flex items-center gap-1">
                  <ArrowUpRight className="h-3 w-3" />
                  {result.department}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Chunk {result.chunkIndex}
              </span>
            </div>
          </div>
        ))}

        {!isLoading && query && results.length === 0 && (
          <div className="text-center py-12">
            <Search className="h-10 w-10 mx-auto text-slate-400 mb-2" />
            <p className="text-sm text-slate-400">No results found for "{query}"</p>
            <p className="text-xs text-slate-500 mt-1">Try different keywords or remove filters</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SemanticSearchPage;