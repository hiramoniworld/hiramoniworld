import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CosmicLayout } from './layouts/CosmicLayout';
import { DailyDiscoveryPage } from './pages/DailyDiscoveryPage';
import { HiddenUniversePage } from './pages/HiddenUniversePage';
import { LandingPage } from './pages/LandingPage';
import { LetterArchivePage } from './pages/LetterArchivePage';
import { LoginPage } from './pages/LoginPage';
import { MemoryGalaxyPage } from './pages/MemoryGalaxyPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { PrivateMessagesPage } from './pages/PrivateMessagesPage';
import { QuestionRoomPage } from './pages/QuestionRoomPage';
import { ScienceLaboratoryPage } from './pages/ScienceLaboratoryPage';
import { SoundOfMemoriesPage } from './pages/SoundOfMemoriesPage';
import { TheMirrorPage } from './pages/TheMirrorPage';
import { TimeMachinePage } from './pages/TimeMachinePage';
import { UnfinishedStoryPage } from './pages/UnfinishedStoryPage';
import { UniverseHubPage } from './pages/UniverseHubPage';
import { AdminPortalPage } from './pages/admin/AdminPortalPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthorized, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-sm text-slate-400">
        Aligning the constellations…
      </div>
    );
  }

  if (!user || !isAuthorized) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <CosmicLayout>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />

              <Route
                path="/universe"
                element={
                  <ProtectedRoute>
                    <UniverseHubPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/galaxy"
                element={
                  <ProtectedRoute>
                    <MemoryGalaxyPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/discovery"
                element={
                  <ProtectedRoute>
                    <DailyDiscoveryPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/questions"
                element={
                  <ProtectedRoute>
                    <QuestionRoomPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/letters"
                element={
                  <ProtectedRoute>
                    <LetterArchivePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/time-machine"
                element={
                  <ProtectedRoute>
                    <TimeMachinePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/hidden"
                element={
                  <ProtectedRoute>
                    <HiddenUniversePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/sound"
                element={
                  <ProtectedRoute>
                    <SoundOfMemoriesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/mirror"
                element={
                  <ProtectedRoute>
                    <TheMirrorPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/story"
                element={
                  <ProtectedRoute>
                    <UnfinishedStoryPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/science"
                element={
                  <ProtectedRoute>
                    <ScienceLaboratoryPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/messages"
                element={
                  <ProtectedRoute>
                    <PrivateMessagesPage />
                  </ProtectedRoute>
                }
              />

              {/* Hidden, Server-Verified Admin Route */}
              <Route path="/admin" element={<AdminPortalPage />} />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </CosmicLayout>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}
