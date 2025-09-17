import { lazy } from 'react';

// Performance-optimized lazy loading with automatic code splitting

// Lazy load all page components for code splitting
export const LazyHomePage = lazy(() => import('@/pages/home-page'));
export const LazyAuthPage = lazy(() => import('@/pages/auth-page'));
export const LazyAdminPage = lazy(() => import('@/pages/admin-page'));
export const LazyAdminLoginPage = lazy(() => import('@/pages/admin-login-page'));
export const LazyUserManagementPage = lazy(() => import('@/pages/user-management-page'));
export const LazyFeedPage = lazy(() => import('@/pages/feed-page'));
export const LazyPostManagementPage = lazy(() => import('@/pages/post-management-page'));
export const LazyUserProfilePage = lazy(() => import('@/pages/user-profile-page'));
export const LazyChangePasswordPage = lazy(() => import('@/pages/change-password-page'));
export const LazyForgotPasswordPage = lazy(() => import('@/pages/forgot-password-page'));
export const LazyResetPasswordPage = lazy(() => import('@/pages/reset-password-page'));
export const LazyRedeemPointsPage = lazy(() => import('@/pages/redeem-points-page'));
export const LazyVerificationManagementPage = lazy(() => import('@/pages/verification-management-page'));
export const LazyRedeemManagementPage = lazy(() => import('@/pages/redeem-management-page'));
export const LazyDrillPage = lazy(() => import('@/pages/drill-page'));
export const LazyDrillManagementPage = lazy(() => import('@/pages/drill-management-page'));
export const LazyMessagesPage = lazy(() => import('@/pages/messages-page'));
export const LazyTryoutsPage = lazy(() => import('@/pages/tryouts-page'));
export const LazyTryoutManagementPage = lazy(() => import('@/pages/tryout-management-page'));
export const LazySportsNewsPage = lazy(() => import('@/pages/sports-news-page'));
export const LazyCricketCoachingPage = lazy(() => import('@/pages/cricket-coaching-page'));
export const LazyTermsPage = lazy(() => import('@/pages/terms-page'));
export const LazyPrivacyPage = lazy(() => import('@/pages/privacy-page'));
export const LazyLandingPage = lazy(() => import('@/pages/landing-page'));
export const LazyNotFound = lazy(() => import('@/pages/not-found'));