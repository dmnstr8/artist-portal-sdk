import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { getAdminPortalRoutes } from 'artist-portal-sdk/admin';
import productionConfig from '../firebase-applet-config.production.json';
import releaseConfig from '../firebase-applet-config.release.json';
import LandingPage from './LandingPage';

const adminRoutes = getAdminPortalRoutes({ productionConfig, releaseConfig });

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        {adminRoutes}
      </Routes>
    </BrowserRouter>
  );
}
