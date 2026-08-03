import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Home from './pages/Home';
import Login from './pages/admin/Login';
import AdminLayout from './pages/admin/AdminLayout';
import ProjectsManager from './pages/admin/ProjectsManager';
import ReviewsManager from './pages/admin/ReviewsManager';
import HeroManager from './pages/admin/HeroManager';
import ExperienceManager from './pages/admin/ExperienceManager';
import ServicesManager from './pages/admin/ServicesManager';
import AboutManager from './pages/admin/AboutManager';
import FooterManager from './pages/admin/FooterManager';
import AnalyticsManager from './pages/admin/AnalyticsManager';
import CustomCursor from './components/CustomCursor';

// Protected Route Wrapper
function ProtectedRoute({ children }) {
  const { currentUser } = useAuth();
  if (!currentUser) {
    return <Navigate to="/admin/login" />;
  }
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <CustomCursor />
        <Analytics />
        <Routes>
          <Route path="/" element={<Home />} />
          
          <Route path="/admin/login" element={<Login />} />
          
          <Route path="/admin" element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/admin/projects" replace />} />
            <Route path="analytics" element={<AnalyticsManager />} />
            <Route path="hero" element={<HeroManager />} />
            <Route path="about" element={<AboutManager />} />
            <Route path="services" element={<ServicesManager />} />
            <Route path="experience" element={<ExperienceManager />} />
            <Route path="projects" element={<ProjectsManager />} />
            <Route path="reviews" element={<ReviewsManager />} />
            <Route path="footer" element={<FooterManager />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}
