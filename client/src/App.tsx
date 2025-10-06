import { Switch, Route, useLocation, Redirect } from "wouter";
import { Suspense, useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { AdminAuthProvider } from "@/hooks/use-admin-auth";
import { UploadProvider } from "@/hooks/use-upload";
import { GlobalUploadBar } from "@/components/global-upload-bar";
import { PWAInstallPrompt } from "@/components/pwa-install-prompt";
import { PWAUpdateNotification } from "@/components/pwa-update-notification";
import { PWADebugger } from "@/components/pwa-debugger";
import { MobileInstallGuide } from "@/components/mobile-install-guide";
import { Loader2 } from "lucide-react";
import "./i18n"; // Initialize i18next
import { ProtectedRoute } from "./lib/protected-route";
import { AdminProtectedRoute } from "./lib/admin-protected-route";
import { AIChatWidget } from "@/components/ai-chat-widget";
import { realtimeEventBus } from "@/lib/realtime";

// Real-time connection manager component
function RealtimeManager() {
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      console.log('🔌 Connecting to real-time system for user:', user.username);
      realtimeEventBus.resetReconnectAttempts();
      realtimeEventBus.connect();
    } else {
      console.log('🔌 Disconnecting from real-time system');
      realtimeEventBus.disconnect();
    }

    return () => {
      realtimeEventBus.disconnect();
    };
  }, [user]);

  return null; // This component doesn't render anything
}

// GTM Analytics Hook
function useGTMPageTracking() {
  const [location] = useLocation();

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).dataLayer) {
      (window as any).dataLayer.push({
        event: 'page_view',
        page_path: location,
        page_title: document.title,
        page_location: window.location.href
      });
    }
  }, [location]);

  // Fire initial page view on app mount
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).dataLayer) {
      (window as any).dataLayer.push({
        event: 'page_view',
        page_path: location,
        page_title: document.title,
        page_location: window.location.href
      });
    }
  }, []); // Empty dependency array = runs only on mount
}

// Lazy-loaded components for optimal bundle splitting
import {
  LazyNotFound,
  LazyHomePage,
  LazyAuthPage,
  LazyAdminPage,
  LazyAdminLoginPage,
  LazyUserManagementPage,
  LazyFeedPage,
  LazyPostManagementPage,
  LazyUserProfilePage,
  LazyChangePasswordPage,
  LazyForgotPasswordPage,
  LazyResetPasswordPage,
  LazyRedeemPointsPage,
  LazyVerificationManagementPage,
  LazyRedeemManagementPage,
  LazyDrillPage,
  LazyDrillManagementPage,
  LazyMessagesPage,
  LazyTryoutsPage,
  LazyTryoutManagementPage,
  LazySportsNewsPage,
  LazyCricketCoachingPage,
  LazyTermsPage,
  LazyPrivacyPage,
  LazyLandingPage,
} from "@/utils/lazy-imports";

// Component to handle root route logic
function LandingPageOrHome() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-green-800">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  // If user is logged in, redirect to /home to maintain consistent URL
  if (user) {
    return <Redirect to="/home" />;
  }

  // Show landing page for non-authenticated users
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-green-800">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    }>
      <LazyLandingPage />
    </Suspense>
  );
}

function Router() {
  const [location] = useLocation();
  const shouldShowAIChat = location !== "/landing" && location !== "/";
  
  // Track page views for Google Analytics
  useGTMPageTracking();

  return (
    <div>
      <GlobalUploadBar />
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-green-800">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
        </div>
      }>
        <Switch>
          {/* Default landing page route */}
          <Route path="/" component={LandingPageOrHome} />
          <ProtectedRoute path="/home">
            <LazyHomePage />
          </ProtectedRoute>
          <ProtectedRoute path="/feed">
            <LazyFeedPage />
          </ProtectedRoute>
          <ProtectedRoute path="/profile/:id">
            <LazyUserProfilePage />
          </ProtectedRoute>
          <ProtectedRoute path="/profile">
            <LazyUserProfilePage />
          </ProtectedRoute>
          <ProtectedRoute path="/change-password">
            <LazyChangePasswordPage />
          </ProtectedRoute>
          <ProtectedRoute path="/redeem-points">
            <LazyRedeemPointsPage />
          </ProtectedRoute>
          <ProtectedRoute path="/drills">
            <LazyDrillPage />
          </ProtectedRoute>
          <ProtectedRoute path="/messages">
            <LazyMessagesPage />
          </ProtectedRoute>
          <ProtectedRoute path="/tryouts">
            <LazyTryoutsPage />
          </ProtectedRoute>
          <ProtectedRoute path="/sports-news">
            <LazySportsNewsPage />
          </ProtectedRoute>
          <ProtectedRoute path="/cricket-coaching">
            <LazyCricketCoachingPage />
          </ProtectedRoute>
          <Route path="/terms">
            <LazyTermsPage />
          </Route>
          <Route path="/privacy">
            <LazyPrivacyPage />
          </Route>
          <AdminProtectedRoute path="/admin">
            <LazyAdminPage />
          </AdminProtectedRoute>
          <AdminProtectedRoute path="/user-management">
            <LazyUserManagementPage />
          </AdminProtectedRoute>
          <AdminProtectedRoute path="/post-management">
            <LazyPostManagementPage />
          </AdminProtectedRoute>
          <AdminProtectedRoute path="/verification-management">
            <LazyVerificationManagementPage />
          </AdminProtectedRoute>
          <AdminProtectedRoute path="/redeem-management">
            <LazyRedeemManagementPage />
          </AdminProtectedRoute>
          <AdminProtectedRoute path="/drill-management">
            <LazyDrillManagementPage />
          </AdminProtectedRoute>
          <AdminProtectedRoute path="/tryout-management">
            <LazyTryoutManagementPage />
          </AdminProtectedRoute>
          <Route path="/auth">
            <Redirect to="/signup" />
          </Route>
          <Route path="/login">
            <LazyAuthPage />
          </Route>
          <Route path="/signup">
            <LazyAuthPage />
          </Route>
          <Route path="/forgot-password">
            <LazyForgotPasswordPage />
          </Route>
          <Route path="/reset-password">
            <LazyResetPasswordPage />
          </Route>
          <Route path="/admin-login">
            <LazyAdminLoginPage />
          </Route>
          <Route>
            <LazyNotFound />
          </Route>
        </Switch>
      </Suspense>
      {shouldShowAIChat && <AIChatWidget />}
      <PWAInstallPrompt />
      <PWAUpdateNotification />
      {/* <MobileInstallGuide /> */}
      {/* <PWADebugger /> */}
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <UploadProvider>
          <AdminAuthProvider>
            <TooltipProvider>
              <RealtimeManager />
              <Toaster />
              <Router />
            </TooltipProvider>
          </AdminAuthProvider>
        </UploadProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
