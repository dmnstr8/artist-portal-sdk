/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, HashRouter } from 'react-router-dom';

import AppRoutes from './app/AppRoutes';
import {
  AdminLeaveAuthGuard,
  CookieConsent,
  Footer,
  Home,
  Nav,
  ScrollToAnchor,
  WidgetManager,
} from './home';
import { shouldUseHashRouting } from './lib/shouldUseHashRouting';
import { useSalonizedEvents } from './lib/salonizedBookingWidget';

export default function App() {
  useSalonizedEvents();
  const Router = shouldUseHashRouting() ? HashRouter : BrowserRouter;

  return (
    <Router>
      <AdminLeaveAuthGuard />
      <ScrollToAnchor />
      <WidgetManager />
      <div className="min-h-screen flex flex-col w-full overflow-x-hidden relative">
        <Nav />
        <div className="flex-grow">
          <AppRoutes
            Home={Home}
            ArtistsPage={ArtistsPage}
            EducationFAQPage={EducationFAQPage}
            RecommendedProductsPage={RecommendedProductsPage}
            LegalPage={LegalPage}
            TermsPage={TermsPage}
            AdminLoginPage={AdminLoginPage}
            AdminDashboardPage={AdminDashboardPage}
          />
        </div>
        <Footer />
        <CookieConsent />
      </div>
    </Router>
  );
}

const EducationFAQPage = React.lazy(() => import('./pages/EducationFAQ'));
const ArtistsPage = React.lazy(() => import('./pages/Artists'));
const RecommendedProductsPage = React.lazy(() => import('./pages/RecommendedProducts'));
const LegalPage = React.lazy(() => import('./pages/Legal'));
const TermsPage = React.lazy(() => import('./pages/Terms'));
const AdminLoginPage = React.lazy(() => import('./pages/AdminLogin'));
const AdminDashboardPage = React.lazy(() => import('artist-portal-sdk/admin'));
