import React from 'react';
import { AlertCircle, Inbox } from 'lucide-react';

export const SkeletonLoader = ({ rows = 4 }) => {
  return (
    <div className="animate-pulse w-full space-y-4">
      <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-1/4 mb-4"></div>
      <div className="border border-slate-200 dark:border-slate-800 rounded overflow-hidden">
        <div className="bg-slate-100 dark:bg-slate-800 h-10 border-b border-slate-200 dark:border-slate-800"></div>
        {[...Array(rows)].map((_, i) => (
          <div key={i} className="h-14 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 space-x-4">
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/6"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-12"></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const CardSkeleton = () => (
  <div className="animate-pulse border border-slate-200 dark:border-slate-800 rounded p-6 bg-white dark:bg-slate-900 space-y-4">
    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3"></div>
    <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-1/2"></div>
    <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-full"></div>
  </div>
);

export const EmptyState = ({ title = "No data found", description = "Get started by adding items.", action }) => (
  <div className="flex flex-col items-center justify-center text-center p-12 border border-dashed border-slate-300 dark:border-slate-800 rounded bg-white dark:bg-slate-900/50">
    <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-400 mb-4">
      <Inbox className="h-8 w-8" />
    </div>
    <h3 className="text-sm font-semibold text-slate-950 dark:text-slate-100 mb-1">{title}</h3>
    <p className="text-xs text-slate-500 dark:text-slate-400 mb-5 max-w-sm">{description}</p>
    {action && (
      <div>{action}</div>
    )}
  </div>
);

export const ErrorState = ({ message = "An error occurred while loading data.", refetch }) => (
  <div className="flex flex-col items-center justify-center text-center p-8 border border-red-200 dark:border-red-900/30 rounded bg-red-50 dark:bg-red-950/10 text-red-800 dark:text-red-300">
    <AlertCircle className="h-8 w-8 text-red-500 mb-3" />
    <h4 className="font-semibold text-xs mb-1">Data Retrieval Failed</h4>
    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mb-4">{message}</p>
    {refetch && (
      <button 
        onClick={refetch} 
        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-semibold shadow-sm transition-colors"
      >
        Retry Request
      </button>
    )}
  </div>
);
