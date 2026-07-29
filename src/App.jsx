import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Home from './pages/Home';
import Login from './pages/admin/Login';
import AdminLayout from './pages/admin/AdminLayout';
import ProjectsManager from './pages/admin/ProjectsManager';
import ReviewsManager from './pages/admin/ReviewsManager';
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
        <Routes>
          <Route path="/" element={<Home />} />
          
          <Route path="/admin/login" element={<Login />} />
          
          <Route path="/admin" element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/admin/projects" replace />} />
            <Route path="projects" element={<ProjectsManager />} />
            <Route path="reviews" element={<ReviewsManager />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}
