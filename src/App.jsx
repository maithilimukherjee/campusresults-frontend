import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Register from './pages/Auth/Register';
import Login from './pages/Auth/Login';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';
import StudentDashboard from './pages/Student/StudentDashboard';
import TeacherDashboard from './pages/Teacher/TeacherDashboard';
import AdminDashboard from './pages/Admin/AdminDashboard';

function App() {
  const { currentUser, userRole, loading } = useAuth();

  if (loading) {
    return <div className="auth-container"><h2>Loading Portal...</h2></div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Dynamic Root Redirect based on role */}
        <Route 
  path="/register" 
  element={
    currentUser && userRole !== 'unassigned' ? (
      <Navigate to={`/${userRole}`} replace />
    ) : (
      <Register />
    )
  } 
/>
        <Route 
          path="/" 
          element={
            !currentUser ? <Navigate to="/login" /> :
            userRole === 'admin' ? <Navigate to="/admin" /> :
            userRole === 'teacher' ? <Navigate to="/teacher" /> :
            <Navigate to="/student" />
          } 
        />
        
        <Route path="/login" element={<Login />} />
        
        <Route 
  path="/admin/*" 
  element={
    <ProtectedRoute allowedRoles={['admin']}>
      <AdminDashboard />
    </ProtectedRoute>
  } 
/>

        {/* Teacher Portal */}
        <Route 
  path="/teacher/*" 
  element={
    <ProtectedRoute allowedRoles={['teacher']}>
      <TeacherDashboard />
    </ProtectedRoute>
  } 
/>

        {/* Student Portal */}
        <Route 
  path="/student/*" 
  element={
    <ProtectedRoute allowedRoles={['student']}>
      <StudentDashboard />
    </ProtectedRoute>
  } 
/>
      </Routes>
    </BrowserRouter>
  );
}

export default App;