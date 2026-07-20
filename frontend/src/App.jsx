import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from './components/Toast';
import { ProtectedRoute, GuestRoute } from './components/RouteGuards';
import { Layout } from './components/Layout';

// Pages
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Documents } from './pages/Documents';
import { AnalyzeDocument } from './pages/AnalyzeDocument';
import { AssessmentDetails } from './pages/AssessmentDetails';
import { AssessmentHistory } from './pages/AssessmentHistory';
import { TrendAnalytics } from './pages/TrendAnalytics';
import { Reports } from './pages/Reports';
import { ReportDetails } from './pages/ReportDetails';
import { DocumentQA } from './pages/DocumentQA';

// Enterprise Pages
import { Workspaces } from './pages/Workspaces';
import { WorkspaceDetail } from './pages/WorkspaceDetail';
import { MultiAudit } from './pages/MultiAudit';
import { SemanticSearchPage } from './pages/SemanticSearch';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            {/* Guest Authentication Routes */}
            <Route element={<GuestRoute />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Route>

            {/* Protected Enterprise Routes */}
            <Route element={<ProtectedRoute />}>
              <Route
                path="/"
                element={
                  <Layout>
                    <Dashboard />
                  </Layout>
                }
              />
              <Route
                path="/documents"
                element={
                  <Layout>
                    <Documents />
                  </Layout>
                }
              />
              <Route
                path="/analyze"
                element={
                  <Layout>
                    <AnalyzeDocument />
                  </Layout>
                }
              />
              <Route
                path="/qa"
                element={
                  <Layout>
                    <DocumentQA />
                  </Layout>
                }
              />
              <Route
                path="/assessments/:id"
                element={
                  <Layout>
                    <AssessmentDetails />
                  </Layout>
                }
              />
              <Route
                path="/history"
                element={
                  <Layout>
                    <AssessmentHistory />
                  </Layout>
                }
              />
              <Route
                path="/trends"
                element={
                  <Layout>
                    <TrendAnalytics />
                  </Layout>
                }
              />
              <Route
                path="/reports"
                element={
                  <Layout>
                    <Reports />
                  </Layout>
                }
              />
              <Route
                path="/reports/:id"
                element={
                  <Layout>
                    <ReportDetails />
                  </Layout>
                }
              />

              {/* === Enterprise Routes === */}
              <Route
                path="/workspaces"
                element={
                  <Layout>
                    <Workspaces />
                  </Layout>
                }
              />
              <Route
                path="/workspaces/:id"
                element={
                  <Layout>
                    <WorkspaceDetail />
                  </Layout>
                }
              />
              <Route
                path="/multi-audit"
                element={
                  <Layout>
                    <MultiAudit />
                  </Layout>
                }
              />
              <Route
                path="/search"
                element={
                  <Layout>
                    <SemanticSearchPage />
                  </Layout>
                }
              />
            </Route>

            {/* Fallback Catch-all Route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </QueryClientProvider>
  );
}

export default App;