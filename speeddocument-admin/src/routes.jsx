import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import DocumentPage from './pages/DocumentPage';
import TemplatePage from './pages/TemplatePage';
import SettingsPage from './pages/SettingsPage';
import AdminPage from './layouts/AdminPage';

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
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminPage />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="templates" element={<TemplatePage />} />
        <Route path="documents" element={<DocumentPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/admin/login" replace />} />
    </Routes>
  );
}