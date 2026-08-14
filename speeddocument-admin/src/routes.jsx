import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Spin } from 'antd';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';


// Protected Route Component
function ProtectedRoute({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  useEffect(() => {
    // Kiểm tra token từ localStorage
    const token = localStorage.getItem('authToken');
    setIsAuthenticated(!!token);
  }, []);

  if (isAuthenticated === null) {
    return <Spin fullscreen tip="Đang tải..." />;
  }

  return isAuthenticated ? children : <Navigate to="/admin/login" replace />;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/admin/login" element={<Login />} />

      <Route
        path="/admin/dashboard"
        element={
        //   <ProtectedRoute>
            <AdminDashboard />
        //   </ProtectedRoute>
        }
      />

      {/* Default redirects */}
      <Route path="/" element={<Navigate to="/admin/login" replace />} />
      <Route path="*" element={<Navigate to="/admin/login" replace />} />
    </Routes>
  );
}