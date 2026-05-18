import { Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from '@/pages/Login';
import EmployeeDashboard from '@/pages/EmployeeDashboard';
import ManagerDashboard from '@/pages/ManagerDashboard';
import AdminDashboard from '@/pages/AdminDashboard';
import { User } from '@/types';

function ProtectedRoute({ user, children, allowedRoles }: { user: User | null; children: React.ReactNode; allowedRoles: string[] }) {
  if (!user) return <Navigate to="/login" />;
  if (!allowedRoles.includes(user.role)) return <Navigate to="/" />;
  return <>{children}</>;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (stored && token) {
      setUser(JSON.parse(stored));
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<Login setUser={setUser} />} />
      <Route path="/" element={
        user ? <Navigate to={`/${user.role === 'employee' ? 'employee' : user.role === 'manager' ? 'manager' : 'admin'}`} /> : <Navigate to="/login" />
      } />
      <Route path="/employee/*" element={
        <ProtectedRoute user={user} allowedRoles={['employee']}>
          <EmployeeDashboard user={user!} setUser={setUser} />
        </ProtectedRoute>
      } />
      <Route path="/manager/*" element={
        <ProtectedRoute user={user} allowedRoles={['manager']}>
          <ManagerDashboard user={user!} setUser={setUser} />
        </ProtectedRoute>
      } />
      <Route path="/admin/*" element={
        <ProtectedRoute user={user} allowedRoles={['admin']}>
          <AdminDashboard user={user!} setUser={setUser} />
        </ProtectedRoute>
      } />
    </Routes>
  );
}
