import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/PythonAuthContext';
import EnhancedMainAdminDashboard from '../pages/EnhancedMainAdminDashboard';

const EnhancedAdminRoute = () => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'main_admin') {
    return <Navigate to="/login" replace />;
  }

  return <EnhancedMainAdminDashboard />;
};

export default EnhancedAdminRoute;