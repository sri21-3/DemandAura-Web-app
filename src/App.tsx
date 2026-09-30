/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useState } from 'react';
import { Footer } from './components/Footer';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { AboutPage } from './pages/AboutPage';
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
  SegmentationRecord,
} from './types/models';

function AppShell() {
  const [currentPage, setCurrentPage] = useState<AppPage>('home');
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
    } catch (err) {
      console.error('Failed preloading segmentation tables:', err);
    } finally {
      setClustersLoading(false);
    }
  }, []);

  useEffect(() => {
    checkBackendHealth();
    loadClusterTables();
  }, [checkBackendHealth, loadClusterTables]);

  const handleNavigate = (page: AppPage) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900">
      <Navbar currentPage={currentPage} onNavigate={handleNavigate} />

      <main className="flex-1">
        {currentPage === 'home' && (
          <HomePage
            onNavigate={handleNavigate}
            health={health}
            healthLoading={healthLoading}
          />
        )}

        {currentPage === 'dashboard' && (
          <ProtectedRoute
            pageName="User Dashboard"
            targetPage="dashboard"
            onNavigate={handleNavigate}
          >
            <DashboardPage
              onNavigate={handleNavigate}
              health={health}
              healthLoading={healthLoading}
              healthError={healthError}
              onRefreshHealth={() => {
                checkBackendHealth();
                loadClusterTables();
              }}
              overallClusters={overallClusters}
              fourWeekClusters={fourWeekClusters}
              clustersLoading={clustersLoading}
            />
          </ProtectedRoute>
        )}

        {currentPage === 'divergence' && (
          <ProtectedRoute
            pageName="Divergence Score Predictor"
            targetPage="divergence"
            onNavigate={handleNavigate}
          >
            <DivergencePage
              overallClusters={overallClusters}
              fourWeekClusters={fourWeekClusters}
            />
          </ProtectedRoute>
        )}

        {currentPage === 'forecast' && (
          <ProtectedRoute
            pageName="Search Interest Forecaster"
            targetPage="forecast"
            onNavigate={handleNavigate}
          >
            <ForecastPage />
          </ProtectedRoute>
        )}

        {currentPage === 'segmentation' && (
          <ProtectedRoute
            pageName="Market Segmentation Explorer"
            targetPage="segmentation"
            onNavigate={handleNavigate}
          >
            <SegmentationPage
              overallClusters={overallClusters}
              fourWeekClusters={fourWeekClusters}
              clustersLoading={clustersLoading}
            />
          </ProtectedRoute>
        )}

        {currentPage === 'history' && (
          <ProtectedRoute
            pageName="Prediction & Query History"
            targetPage="history"
            onNavigate={handleNavigate}
          >
            <HistoryPage onNavigate={handleNavigate} />
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
