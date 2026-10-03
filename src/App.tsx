/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useState } from 'react';
import { DashboardSidebar } from './components/DashboardSidebar';
import { Footer } from './components/Footer';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { AboutPage } from './pages/AboutPage';
import { AdminPage } from './pages/AdminPage';
import { AuthView, ProfilePage } from './pages/AuthPages';
import { ContactPage } from './pages/ContactPage';
import { DashboardPage } from './pages/DashboardPage';
import { DivergencePage } from './pages/DivergencePage';
import { ForecastPage } from './pages/ForecastPage';
import { HistoryPage } from './pages/HistoryPage';
import { HomePage } from './pages/HomePage';
import { SegmentationPage } from './pages/SegmentationPage';
import { nexusDemandApi } from './services/nexusDemandApi';
import {
  AppPage,
  HealthResponse,
  MarkdownReportResponse,
  SegmentationRecord,
} from './types/models';

const WORKSPACE_PAGES = new Set<AppPage>([
  'dashboard',
  'divergence',
  'forecast',
  'segmentation',
  'history',
]);

function AppShell() {
  const [currentPage, setCurrentPage] = useState<AppPage>('home');
  const [systemAnnouncement, setSystemAnnouncement] = useState<string | null>(
    null
  );
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [healthLoading, setHealthLoading] = useState(true);
  const [healthError, setHealthError] = useState<string | null>(null);

  const [overallClusters, setOverallClusters] = useState<SegmentationRecord[]>(
    []
  );
  const [fourWeekClusters, setFourWeekClusters] = useState<
    SegmentationRecord[]
  >([]);
  const [clustersLoading, setClustersLoading] = useState(true);

  const [overallReport, setOverallReport] =
    useState<MarkdownReportResponse | null>(null);
  const [fourWeekReport, setFourWeekReport] =
    useState<MarkdownReportResponse | null>(null);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [reportsError, setReportsError] = useState<string | null>(null);

  const checkBackendHealth = useCallback(async () => {
    setHealthLoading(true);
    setHealthError(null);
    try {
      const res = await nexusDemandApi.checkHealth();
      setHealth(res);
    } catch (err: unknown) {
      setHealthError(
        err instanceof Error
          ? err.message
          : 'Failed to reach FastAPI health check.'
      );
    } finally {
      setHealthLoading(false);
    }
  }, []);

  const loadClusterTables = useCallback(async () => {
    setClustersLoading(true);
    try {
      const [overallRes, fourWeekRes] = await Promise.all([
        nexusDemandApi.getMarketSegmentation(),
        nexusDemandApi.get4WeeksSegmentation(),
      ]);
      setOverallClusters(overallRes.data || []);
      setFourWeekClusters(fourWeekRes.data || []);
    } catch {
      // Handled gracefully by retry logic and UI status banners
    } finally {
      setClustersLoading(false);
    }
  }, []);

  const loadClusterReports = useCallback(async () => {
    setReportsLoading(true);
    setReportsError(null);
    try {
      const [repOverall, rep4W] = await Promise.all([
        nexusDemandApi.getMarketSegmentationReport(),
        nexusDemandApi.get4WeeksSegmentationReport(),
      ]);
      setOverallReport(repOverall);
      setFourWeekReport(rep4W);
    } catch (err: unknown) {
      setReportsError(
        err instanceof Error
          ? err.message
          : 'Failed loading weekly market segment reports from backend.'
      );
    } finally {
      setReportsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkBackendHealth();
    loadClusterTables();
    loadClusterReports();
  }, [checkBackendHealth, loadClusterTables, loadClusterReports]);

  const handleNavigate = (page: AppPage) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isWorkspaceRoute = WORKSPACE_PAGES.has(currentPage);

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900">
      <Navbar currentPage={currentPage} onNavigate={handleNavigate} />

      {systemAnnouncement && (
        <div className="bg-gradient-to-r from-[#070E24] via-indigo-950 to-[#070E24] border-b border-indigo-500/40 px-6 py-2.5 text-xs text-white shadow-md">
          <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 flex-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 uppercase tracking-wider font-mono">
                Platform Alert
              </span>
              <span className="font-medium text-slate-200">
                {systemAnnouncement}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSystemAnnouncement(null)}
              className="text-slate-400 hover:text-white text-sm cursor-pointer px-1.5"
              title="Dismiss Announcement"
            >
              &times;
            </button>
          </div>
        </div>
      )}

      <main className="flex-1">
        {currentPage === 'home' && (
          <HomePage
            onNavigate={handleNavigate}
            health={health}
            healthLoading={healthLoading}
          />
        )}

        {isWorkspaceRoute && (
          <ProtectedRoute
            pageName="DemandAura Intelligence Workspace"
            targetPage={currentPage}
            onNavigate={handleNavigate}
          >
            <div className="max-w-[1440px] mx-auto flex flex-col lg:flex-row min-h-[calc(100vh-4rem)]">
              <DashboardSidebar
                currentPage={currentPage}
                onNavigate={handleNavigate}
              />
              <div className="flex-1 min-w-0">
                {currentPage === 'dashboard' && (
                  <DashboardPage
                    onNavigate={handleNavigate}
                    health={health}
                    healthLoading={healthLoading}
                    healthError={healthError}
                    onRefreshHealth={() => {
                      checkBackendHealth();
                      loadClusterTables();
                      loadClusterReports();
                    }}
                    overallClusters={overallClusters}
                    fourWeekClusters={fourWeekClusters}
                    clustersLoading={clustersLoading}
                    overallReport={overallReport}
                    fourWeekReport={fourWeekReport}
                    reportsLoading={reportsLoading}
                  />
                )}

                {currentPage === 'divergence' && (
                  <DivergencePage
                    overallClusters={overallClusters}
                    fourWeekClusters={fourWeekClusters}
                    overallReport={overallReport}
                    fourWeekReport={fourWeekReport}
                  />
                )}

                {currentPage === 'forecast' && <ForecastPage />}

                {currentPage === 'segmentation' && (
                  <SegmentationPage
                    overallClusters={overallClusters}
                    fourWeekClusters={fourWeekClusters}
                    clustersLoading={clustersLoading}
                    overallReport={overallReport}
                    fourWeekReport={fourWeekReport}
                    reportsLoading={reportsLoading}
                    reportsError={reportsError}
                    onRefreshAll={async () => {
                      await Promise.all([
                        loadClusterTables(),
                        loadClusterReports(),
                      ]);
                    }}
                  />
                )}

                {currentPage === 'history' && (
                  <HistoryPage onNavigate={handleNavigate} />
                )}
              </div>
            </div>
          </ProtectedRoute>
        )}

        {currentPage === 'about' && <AboutPage onNavigate={handleNavigate} />}

        {currentPage === 'contact' && (
          <ContactPage onNavigate={handleNavigate} />
        )}

        {currentPage === 'signin' && (
          <AuthView mode="signin" onNavigate={handleNavigate} />
        )}

        {currentPage === 'signup' && (
          <AuthView mode="signup" onNavigate={handleNavigate} />
        )}

        {currentPage === 'profile' && (
          <ProtectedRoute
            pageName="Analyst Profile"
            targetPage="profile"
            onNavigate={handleNavigate}
          >
            <ProfilePage onNavigate={handleNavigate} />
          </ProtectedRoute>
        )}

        {currentPage === 'admin' && (
          <AdminPage
            onNavigate={handleNavigate}
            systemAnnouncement={systemAnnouncement}
            onUpdateSystemAnnouncement={setSystemAnnouncement}
          />
        )}
      </main>

      <Footer onNavigate={handleNavigate} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}
