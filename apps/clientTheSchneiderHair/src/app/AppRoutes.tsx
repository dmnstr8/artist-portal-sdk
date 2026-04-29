import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from 'artist-portal-sdk/admin';
import RouteLoadingFallback from '../shared/ui/RouteLoadingFallback';

type PageComponent = React.ComponentType;

interface AppRoutesProps {
  Home: PageComponent;
  ArtistsPage: PageComponent;
  EducationFAQPage: PageComponent;
  RecommendedProductsPage: PageComponent;
  LegalPage: PageComponent;
  TermsPage: PageComponent;
  AdminLoginPage: PageComponent;
  AdminDashboardPage: PageComponent;
}

export default function AppRoutes({
  Home,
  ArtistsPage,
  EducationFAQPage,
  RecommendedProductsPage,
  LegalPage,
  TermsPage,
  AdminLoginPage,
  AdminDashboardPage,
}: AppRoutesProps) {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/index.html" element={<Home />} />
      <Route path="/docs/index.html" element={<Home />} />
      <Route
        path="/artists"
        element={
          <React.Suspense fallback={<RouteLoadingFallback />}>
            <ArtistsPage />
          </React.Suspense>
        }
      />
      <Route
        path="/education"
        element={
          <React.Suspense fallback={<RouteLoadingFallback />}>
            <EducationFAQPage />
          </React.Suspense>
        }
      />
      <Route
        path="/products"
        element={
          <React.Suspense fallback={<RouteLoadingFallback />}>
            <RecommendedProductsPage />
          </React.Suspense>
        }
      />
      <Route
        path="/legal"
        element={
          <React.Suspense fallback={<RouteLoadingFallback />}>
            <LegalPage />
          </React.Suspense>
        }
      />
      <Route
        path="/terms"
        element={
          <React.Suspense fallback={<RouteLoadingFallback />}>
            <TermsPage />
          </React.Suspense>
        }
      />
      <Route
        path="/artist-login"
        element={
          <React.Suspense fallback={<RouteLoadingFallback />}>
            <AdminLoginPage />
          </React.Suspense>
        }
      />
      <Route
        path="/artist-portal"
        element={
          <ProtectedRoute>
            <React.Suspense fallback={<RouteLoadingFallback />}>
              <AdminDashboardPage />
            </React.Suspense>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Home />} />
    </Routes>
  );
}
