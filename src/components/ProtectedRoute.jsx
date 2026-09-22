import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { currentUser, userRole } = useAuth();

  // If no user is logged in, kick them back to the login screen
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // If the route has specific role requirements and the user doesn't match
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    // Route them back to their own designated portal
    if (userRole === 'admin') return <Navigate to="/admin" replace />;
    if (userRole === 'teacher') return <Navigate to="/teacher" replace />;
    if (userRole === 'student') return <Navigate to="/student" replace />;
    
    // Fallback for 'unassigned' or unexpected roles
    return <Navigate to="/login" replace />;
  }

  // If authorized, render the requested component
  return children;
}