import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('access_token');
  const user = JSON.parse(localStorage.getItem('user'));
  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }
  if (user.role !== 'admin') {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
}

function PublicRoute({ children }) {
  const token = localStorage.getItem('access_token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  return token && user.role === 'admin' ? (
    <Navigate to="/admin/dashboard" replace />
  ) : (
    children
  );
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/admin/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />

      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/admin/login" replace />} />
    </Routes>
  );
}