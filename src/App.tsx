/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider } from './contexts/LanguageContext';
import { ApplicationProvider } from './contexts/ApplicationContext';
import { AuthProvider } from './contexts/AuthContext';

// Layout
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';

// Pages
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Applications from './pages/Applications';
import ApplicationDetails from './pages/ApplicationDetails';
import InboxIntelligence from './pages/InboxIntelligence';
import CareerAnalytics from './pages/CareerAnalytics';
import Interviews from './pages/Interviews';
import ResumeMatching from './pages/ResumeMatching';
import JobRecommendations from './pages/JobRecommendations';
import Settings from './pages/Settings';

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <ApplicationProvider>
          <Router>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/auth" element={<AuthPage />} />
              
              <Route element={<ProtectedRoute />}>
                <Route path="/onboarding" element={<Onboarding />} />
                
                <Route path="/app" element={<AppLayout />}>
                  <Route index element={<Dashboard />} />
                  <Route path="applications" element={<Applications />} />
                  <Route path="applications/:id" element={<ApplicationDetails />} />
                  <Route path="jobs" element={<JobRecommendations />} />
                  <Route path="inbox" element={<InboxIntelligence />} />
                  <Route path="interviews" element={<Interviews />} />
                  <Route path="resumes" element={<ResumeMatching />} />
                  <Route path="analytics" element={<CareerAnalytics />} />
                  <Route path="settings" element={<Settings />} />
                </Route>
              </Route>
              
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </ApplicationProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

