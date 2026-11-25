import React, { useEffect } from 'react';
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { BrandingProvider } from './context/BrandingContext';
import { AuthProvider, parseSharedPath, useAuth } from './context/AuthContext';
import { trackPageView } from './config/analytics';
import { LoadingScreen } from './components/LoadingScreen';
import { AppShell } from './components/AppShell';
import { LandingPage } from './pages/LandingPage';
import { WelcomePage } from './pages/WelcomePage';
import { PhoneLoginPage } from './pages/PhoneLoginPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { PendingDeletionPage } from './pages/PendingDeletionPage';
import { DiscoverPage } from './pages/DiscoverPage';
import { RoomDetailPage } from './pages/RoomDetailPage';
import { CommunityFeedPage } from './pages/CommunityFeedPage';
import { PostDetailPage } from './pages/PostDetailPage';
import { CreatePostPage } from './pages/CreatePostPage';
import { ConversationsPage } from './pages/ConversationsPage';
import { ChatThreadPage } from './pages/ChatThreadPage';
import { OwnProfilePage } from './pages/OwnProfilePage';
import { EditProfilePage } from './pages/EditProfilePage';
import { OtherProfilePage } from './pages/OtherProfilePage';
import { CreateListingPage } from './pages/CreateListingPage';
import { MyListingsPage } from './pages/MyListingsPage';
import { LifestyleSetupPage } from './pages/LifestyleSetupPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { SettingsPage } from './pages/SettingsPage';

function DeepLinkEntry() {
  const location = useLocation();
  const { status, setPendingShared } = useAuth();

  useEffect(() => {
    const parsed = parseSharedPath(location.pathname);
    if (parsed && status !== 'authenticated') {
      setPendingShared(parsed);
    }
  }, [location.pathname, status, setPendingShared]);

  const parsed = parseSharedPath(location.pathname);
  if (status === 'initializing') {
    return <LoadingScreen />;
  }
  if (!parsed) {
    return <Navigate to="/home" replace />;
  }
  if (status === 'authenticated') {
    return <Navigate to={parsed.targetRoute} replace />;
  }
  if (status === 'needsOnboarding') {
    return <Navigate to="/onboarding" replace />;
  }
  if (status === 'pendingDeletion') {
    return <Navigate to="/account/pending-deletion" replace />;
  }
  return <Navigate to="/welcome" replace />;
}

function AuthGate({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  if (status === 'initializing') return <LoadingScreen />;
  if (status === 'unauthenticated') return <Navigate to="/welcome" replace />;
  if (status === 'needsOnboarding') return <Navigate to="/onboarding" replace />;
  if (status === 'pendingDeletion') {
    return <Navigate to="/account/pending-deletion" replace />;
  }
  return <AppShell>{children}</AppShell>;
}

function GuestOnly({ children }: { children: React.ReactNode }) {
  const { status, pendingShared, consumePendingShared } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (status === 'authenticated') {
      const pending = consumePendingShared();
      navigate(pending ? pending.targetRoute : '/home', { replace: true });
    }
  }, [status, pendingShared, consumePendingShared, navigate]);

  if (status === 'initializing') return <LoadingScreen />;
  if (status === 'needsOnboarding') return <Navigate to="/onboarding" replace />;
  if (status === 'pendingDeletion') {
    return <Navigate to="/account/pending-deletion" replace />;
  }
  if (status === 'authenticated') return <LoadingScreen />;
  return <>{children}</>;
}

function OnboardingGate() {
  const { status, consumePendingShared } = useAuth();
  if (status === 'initializing') return <LoadingScreen />;
  if (status === 'unauthenticated') return <Navigate to="/welcome" replace />;
  if (status === 'pendingDeletion') {
    return <Navigate to="/account/pending-deletion" replace />;
  }
  if (status === 'authenticated') {
    const pending = consumePendingShared();
    return <Navigate to={pending ? pending.targetRoute : '/home'} replace />;
  }
  return <OnboardingPage />;
}

function PendingDeletionGate() {
  const { status } = useAuth();
  if (status === 'initializing') return <LoadingScreen />;
  if (status === 'unauthenticated') return <Navigate to="/welcome" replace />;
  if (status === 'authenticated') return <Navigate to="/home" replace />;
  if (status === 'needsOnboarding') return <Navigate to="/onboarding" replace />;
  return <PendingDeletionPage />;
}

function AnalyticsTracker() {
  const location = useLocation();
  useEffect(() => {
    trackPageView(location.pathname + location.search);
  }, [location.pathname, location.search]);
  return null;
}

export function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <BrandingProvider>
          <AuthProvider>
            <BrowserRouter>
              <AnalyticsTracker />
              <Routes>
                <Route path="/" element={<LandingPage />} />

                {/* Deep links (same URLs claimed by Android App Links) */}
                <Route path="/room/:id" element={<DeepLinkEntry />} />
                <Route path="/post/:id" element={<DeepLinkEntry />} />

                {/* Auth & Onboarding */}
                <Route
                  path="/welcome"
                  element={
                    <GuestOnly>
                      <WelcomePage />
                    </GuestOnly>
                  }
                />
                <Route
                  path="/welcome/phone"
                  element={
                    <GuestOnly>
                      <PhoneLoginPage />
                    </GuestOnly>
                  }
                />
                <Route path="/onboarding" element={<OnboardingGate />} />
                <Route
                  path="/account/pending-deletion"
                  element={<PendingDeletionGate />}
                />

                {/* Authenticated App Routes */}
                <Route
                  path="/home"
                  element={
                    <AuthGate>
                      <DiscoverPage />
                    </AuthGate>
                  }
                />
                <Route
                  path="/discover"
                  element={<Navigate to="/home" replace />}
                />
                <Route
                  path="/discover/room/:id"
                  element={
                    <AuthGate>
                      <RoomDetailPage />
                    </AuthGate>
                  }
                />
                <Route
                  path="/feed"
                  element={
                    <AuthGate>
                      <CommunityFeedPage />
                    </AuthGate>
                  }
                />
                <Route
                  path="/community/new"
                  element={
                    <AuthGate>
                      <CreatePostPage />
                    </AuthGate>
                  }
                />
                <Route
                  path="/community/post/:id"
                  element={
                    <AuthGate>
                      <PostDetailPage />
                    </AuthGate>
                  }
                />
                <Route
                  path="/chat"
                  element={
                    <AuthGate>
                      <ConversationsPage />
                    </AuthGate>
                  }
                />
                <Route
                  path="/chat/:conversationId"
                  element={
                    <AuthGate>
                      <ChatThreadPage />
                    </AuthGate>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <AuthGate>
                      <OwnProfilePage />
                    </AuthGate>
                  }
                />
                <Route
                  path="/profile/edit"
                  element={
                    <AuthGate>
                      <EditProfilePage />
                    </AuthGate>
                  }
                />
                <Route
                  path="/profile/strength"
                  element={
                    <AuthGate>
                      <LifestyleSetupPage />
                    </AuthGate>
                  }
                />
                <Route
                  path="/users/:userId"
                  element={
                    <AuthGate>
                      <OtherProfilePage />
                    </AuthGate>
                  }
                />
                <Route
                  path="/listings/new"
                  element={
                    <AuthGate>
                      <CreateListingPage />
                    </AuthGate>
                  }
                />
                <Route
                  path="/listings/:id/edit"
                  element={
                    <AuthGate>
                      <CreateListingPage />
                    </AuthGate>
                  }
                />
                <Route
                  path="/listings/my"
                  element={
                    <AuthGate>
                      <MyListingsPage mode="my" />
                    </AuthGate>
                  }
                />
                <Route
                  path="/listings/liked"
                  element={
                    <AuthGate>
                      <MyListingsPage mode="liked" />
                    </AuthGate>
                  }
                />
                <Route
                  path="/notifications"
                  element={
                    <AuthGate>
                      <NotificationsPage />
                    </AuthGate>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <AuthGate>
                      <SettingsPage />
                    </AuthGate>
                  }
                />

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
          </AuthProvider>
        </BrandingProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
export default App;
