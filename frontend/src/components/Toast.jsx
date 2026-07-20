import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-start gap-3 p-4 rounded border shadow-lg bg-white dark:bg-slate-900 transition-all duration-300 transform translate-y-0 ${
              toast.type === 'success' ? 'border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300' :
              toast.type === 'error' ? 'border-red-200 dark:border-red-800 text-red-800 dark:text-red-300' :
              toast.type === 'warning' ? 'border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300' :
              'border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-300'
            }`}
          >
            <div className="flex-shrink-0 mt-0.5">
              {toast.type === 'success' && <CheckCircle className="h-5 w-5 text-emerald-500" />}
              {toast.type === 'error' && <AlertCircle className="h-5 w-5 text-red-500" />}
              {toast.type === 'warning' && <AlertTriangle className="h-5 w-5 text-amber-500" />}
              {toast.type === 'info' && <Info className="h-5 w-5 text-blue-500" />}
            </div>
            <div className="flex-1 text-sm font-medium">{toast.message}</div>
            <button
              onClick={() => removeToast(toast.id)}
              className="flex-shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
};
