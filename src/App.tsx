/// <reference types="react-helmet-async" />
import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useIsAuthenticated } from '@azure/msal-react';
import { Helmet } from 'react-helmet-async';
import { Toaster } from 'react-hot-toast';
import { Box } from '@mui/material';

import { Layout } from './components/Layout';
import { LoadingScreen } from './components/LoadingScreen';
import { AuthWrapper } from './components/AuthWrapper';
import { ProtectedRoute } from './components/ProtectedRoute';

// Lazy load pages for better performance
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const SettingsPage = React.lazy(() => import('./pages/SettingsPage'));
const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const NotFoundPage = React.lazy(() => import('./pages/NotFoundPage'));
const UnauthorizedPage = React.lazy(() => import('./pages/UnauthorizedPage'));
const UploadPage = React.lazy(() => import('./pages/UploadPage'));

export const App: React.FC = () => {
  const isAuthenticated = useIsAuthenticated();
  const location = useLocation();

  return (
    <>
      {/* Global SEO and Security Headers */}
      <Helmet
        titleTemplate="%s | Tarra Monitoring System"
        defaultTitle="Tarra Monitoring System - Enterprise Vibration Monitoring"
      >
        <meta name="description" content="Enterprise-grade vibration monitoring system with real-time analytics, Azure AD security, and comprehensive sensor management." />
        <meta name="keywords" content="vibration monitoring, industrial sensors, real-time analytics, enterprise security, IoT monitoring" />
        <meta name="robots" content="noindex, nofollow" />
        <meta name="referrer" content="strict-origin-when-cross-origin" />
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="X-Frame-Options" content="DENY" />
        <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
        <link rel="canonical" href={window.location.href} />
      </Helmet>

      {/* Toast notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#4caf50',
              secondary: '#fff',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#f44336',
              secondary: '#fff',
            },
          },
        }}
      />

      {/* Main Application Routes */}
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <React.Suspense fallback={<LoadingScreen />}>
          <Routes>
            {/* Public Routes */}
            <Route
              path="/login"
              element={
                isAuthenticated ? (
                  <Navigate to="/dashboard" replace />
                ) : (
                  <LoginPage />
                )
              }
            />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />

            {/* Protected Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              {/* Default redirect to dashboard for authenticated users */}
              <Route 
                index 
                element={
                  isAuthenticated ? (
                    <Navigate to="/dashboard" replace />
                  ) : (
                    <Navigate to="/login" replace />
                  )
                } 
              />
              
              {/* Dashboard */}
              <Route path="dashboard" element={<Dashboard />} />

              {/* Upload */}
              <Route path="upload" element={<UploadPage />} />

              {/* Settings */}
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            {/* 404 Page */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </React.Suspense>
      </Box>

      {/* Authentication Wrapper for handling auth state */}
      <AuthWrapper />
    </>
  );
};