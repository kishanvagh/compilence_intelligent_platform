import React, { useState, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
  LayoutDashboard, 
  FileText, 
  History, 
  TrendingUp, 
  BookOpen, 
  ShieldCheck, 
  LogOut, 
  Sun, 
  Moon, 
  Menu,
  X,
  User,
  HelpCircle,
  FolderOpen,
  Search,
  Layers
} from 'lucide-react';

export const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Upload Document', path: '/documents', icon: FileText },
    { name: 'Analyze Document', path: '/analyze', icon: ShieldCheck },
    { name: 'Q&A with PDF', path: '/qa', icon: HelpCircle },
  ];

  const enterpriseNavItems = [
    { name: 'Workspaces', path: '/workspaces', icon: FolderOpen },
    { name: 'Multi-Document Audit', path: '/multi-audit', icon: Layers },
    { name: 'Semantic Search', path: '/search', icon: Search },
    { name: 'Assessment History', path: '/history', icon: History },
    { name: 'Trend Analytics', path: '/trends', icon: TrendingUp },
    { name: 'Compliance Reports', path: '/reports', icon: BookOpen },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
      {/* Mobile Top Bar */}
      <header className="lg:hidden bg-slate-900 text-white flex items-center justify-between p-4 border-b border-slate-800 no-print">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-blue-500" />
          <span className="font-bold tracking-tight text-lg">Compliance Intel</span>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setDarkMode(!darkMode)}
            className="p-1.5 rounded hover:bg-slate-800"
            title="Toggle theme"
          >
            {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded hover:bg-slate-800"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Overlay (Mobile) */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden no-print"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside className={`
          fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 border-r border-slate-800 flex flex-col transform transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 no-print
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          {/* Logo Section */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800 bg-slate-950">
            <Link to="/" className="flex items-center gap-2" onClick={() => setSidebarOpen(false)}>
              <ShieldCheck className="h-6 w-6 text-blue-500" />
              <span className="font-bold tracking-tight text-white text-lg">Compliance Intel</span>
            </Link>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 rounded hover:bg-slate-800 text-slate-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {/* Core */}
            <p className="px-4 py-1 text-[10px] font-bold text-slate-600 uppercase tracking-widest">Core</p>
            {navItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) => `
                  flex items-center gap-3 px-4 py-2.5 rounded font-medium text-sm transition-colors duration-150
                  ${isActive 
                    ? 'bg-blue-600 text-white' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'}
                `}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </NavLink>
            ))}

            {/* Enterprise */}
            <p className="px-4 pt-4 pb-1 text-[10px] font-bold text-slate-600 uppercase tracking-widest">Enterprise</p>
            {enterpriseNavItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) => `
                  flex items-center gap-3 px-4 py-2.5 rounded font-medium text-sm transition-colors duration-150
                  ${isActive 
                    ? 'bg-blue-600 text-white' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'}
                `}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </NavLink>
            ))}
          </nav>

          {/* User Profile / Logout footer */}
          <div className="p-4 border-t border-slate-800 bg-slate-950 flex flex-col gap-2">
            <div className="flex items-center gap-3 px-2 py-1">
              <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-200 border border-slate-700">
                <User className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{user?.name || 'User'}</p>
                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
              </div>
            </div>
            <button 
              onClick={logout}
              className="flex items-center justify-center gap-2 w-full mt-2 px-4 py-2 rounded border border-slate-800 hover:border-slate-700 text-sm font-medium hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </aside>

        {/* Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Desktop Top Header */}
          <header className="hidden lg:flex h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 items-center justify-between px-8 no-print shadow-sm">
            <div className="text-sm text-slate-500 dark:text-slate-400 font-medium">
              Enterprise Compliance Audit Platform
            </div>
            <div className="flex items-center gap-6">
              <button 
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400"
                title="Toggle Dark Mode"
              >
                {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
              <div className="flex items-center gap-2 border-l border-slate-200 dark:border-slate-800 pl-6">
                <div className="h-7 w-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                  {(user?.name || 'U').charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium">{user?.name}</span>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto p-6 lg:p-8 bg-slate-50 dark:bg-slate-950">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};
