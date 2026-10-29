import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Landing from '../pages/Landing';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Unauthorized from '../pages/Unauthorized';

import Dashboard from '../pages/Dashboard';
import CreateComplaint from '../pages/CreateComplaint';
import MyComplaints from '../pages/MyComplaints';
import Notifications from '../pages/Notifications';
import Profile from '../pages/Profile';
import SingleComplaintDetails from '../pages/SingleComplaintDetails';

import PendingComplaints from '../pages/PendingComplaints';
import AssignedComplaints from '../pages/AssignedComplaints';
import AllComplaints from '../pages/AllComplaints';

import UserManagement from '../pages/admin/UserManagement';
import DepartmentManagement from '../pages/admin/DepartmentManagement';
import CategoryManagement from '../pages/admin/CategoryManagement';
import ReportsAnalytics from '../pages/admin/ReportsAnalytics';
import SlaManagement from '../pages/admin/SlaManagement';

import StudentDashboard from '../pages/dashboards/StudentDashboard';
import FacultyDashboard from '../pages/dashboards/FacultyDashboard';
import AdminDashboard from '../pages/dashboards/AdminDashboard';
import FacilityOfficerDashboard from '../pages/dashboards/FacilityOfficerDashboard';
import MaintenanceDashboard from '../pages/dashboards/MaintenanceDashboard';

import { useAuth } from '../context/AuthContext';

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F0E6]">
        <div className="flex items-center gap-3">
          <svg className="animate-spin h-5 w-5 text-[#B01834]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-xs font-bold uppercase tracking-wider text-[#667085]">Loading session...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}

export function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Main Generic Dashboard Route */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      {/* ========================================================= */}
      {/* STUDENT ROUTES */}
      {/* ========================================================= */}
      <Route
        path="/student/dashboard"
        element={
          <ProtectedRoute allowedRoles={['Student']}>
            <StudentDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/complaints"
        element={
          <ProtectedRoute allowedRoles={['Student']}>
            <MyComplaints />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/complaints/new"
        element={
          <ProtectedRoute allowedRoles={['Student']}>
            <CreateComplaint />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/complaints/:complaintId"
        element={
          <ProtectedRoute allowedRoles={['Student']}>
            <SingleComplaintDetails />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/notifications"
        element={
          <ProtectedRoute allowedRoles={['Student']}>
            <Notifications />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/profile"
        element={
          <ProtectedRoute allowedRoles={['Student']}>
            <Profile />
          </ProtectedRoute>
        }
      />

      {/* ========================================================= */}
      {/* FACULTY ROUTES */}
      {/* ========================================================= */}
      <Route
        path="/faculty/dashboard"
        element={
          <ProtectedRoute allowedRoles={['Faculty']}>
            <FacultyDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/faculty/complaints"
        element={
          <ProtectedRoute allowedRoles={['Faculty']}>
            <MyComplaints />
          </ProtectedRoute>
        }
      />
      <Route
        path="/faculty/complaints/new"
        element={
          <ProtectedRoute allowedRoles={['Faculty']}>
            <CreateComplaint />
          </ProtectedRoute>
        }
      />
      <Route
        path="/faculty/complaints/:complaintId"
        element={
          <ProtectedRoute allowedRoles={['Faculty']}>
            <SingleComplaintDetails />
          </ProtectedRoute>
        }
      />
      <Route
        path="/faculty/notifications"
        element={
          <ProtectedRoute allowedRoles={['Faculty']}>
            <Notifications />
          </ProtectedRoute>
        }
      />
      <Route
        path="/faculty/profile"
        element={
          <ProtectedRoute allowedRoles={['Faculty']}>
            <Profile />
          </ProtectedRoute>
        }
      />

      {/* ========================================================= */}
      {/* FACILITY OFFICER ROUTES */}
      {/* ========================================================= */}
      <Route
        path="/facility-officer/dashboard"
        element={
          <ProtectedRoute allowedRoles={['Facility Officer']}>
            <FacilityOfficerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/facility-officer/pending"
        element={
          <ProtectedRoute allowedRoles={['Facility Officer']}>
            <PendingComplaints />
          </ProtectedRoute>
        }
      />
      <Route
        path="/facility-officer/complaints"
        element={
          <ProtectedRoute allowedRoles={['Facility Officer']}>
            <AllComplaints />
          </ProtectedRoute>
        }
      />
      <Route
        path="/facility-officer/complaints/:complaintId"
        element={
          <ProtectedRoute allowedRoles={['Facility Officer']}>
            <SingleComplaintDetails />
          </ProtectedRoute>
        }
      />
      <Route
        path="/facility-officer/notifications"
        element={
          <ProtectedRoute allowedRoles={['Facility Officer']}>
            <Notifications />
          </ProtectedRoute>
        }
      />
      <Route
        path="/facility-officer/profile"
        element={
          <ProtectedRoute allowedRoles={['Facility Officer']}>
            <Profile />
          </ProtectedRoute>
        }
      />

      {/* ========================================================= */}
      {/* MAINTENANCE TEAM ROUTES */}
      {/* ========================================================= */}
      <Route
        path="/maintenance/dashboard"
        element={
          <ProtectedRoute allowedRoles={['Maintenance Team']}>
            <MaintenanceDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/maintenance/complaints"
        element={
          <ProtectedRoute allowedRoles={['Maintenance Team']}>
            <AssignedComplaints />
          </ProtectedRoute>
        }
      />
      <Route
        path="/maintenance/complaints/:complaintId"
        element={
          <ProtectedRoute allowedRoles={['Maintenance Team']}>
            <SingleComplaintDetails />
          </ProtectedRoute>
        }
      />
      <Route
        path="/maintenance/notifications"
        element={
          <ProtectedRoute allowedRoles={['Maintenance Team']}>
            <Notifications />
          </ProtectedRoute>
        }
      />
      <Route
        path="/maintenance/profile"
        element={
          <ProtectedRoute allowedRoles={['Maintenance Team']}>
            <Profile />
          </ProtectedRoute>
        }
      />

      {/* ========================================================= */}
      {/* ADMINISTRATOR ROUTES */}
      {/* ========================================================= */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={['Administrator']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/complaints"
        element={
          <ProtectedRoute allowedRoles={['Administrator']}>
            <AllComplaints />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/complaints/:complaintId"
        element={
          <ProtectedRoute allowedRoles={['Administrator']}>
            <SingleComplaintDetails />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute allowedRoles={['Administrator']}>
            <UserManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/departments"
        element={
          <ProtectedRoute allowedRoles={['Administrator']}>
            <DepartmentManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/categories"
        element={
          <ProtectedRoute allowedRoles={['Administrator']}>
            <CategoryManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/reports"
        element={
          <ProtectedRoute allowedRoles={['Administrator']}>
            <ReportsAnalytics />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/sla"
        element={
          <ProtectedRoute allowedRoles={['Administrator']}>
            <SlaManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/notifications"
        element={
          <ProtectedRoute allowedRoles={['Administrator']}>
            <Notifications />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/profile"
        element={
          <ProtectedRoute allowedRoles={['Administrator']}>
            <Profile />
          </ProtectedRoute>
        }
      />

      {/* General Aliases */}
      <Route path="/create-complaint" element={<ProtectedRoute><CreateComplaint /></ProtectedRoute>} />
      <Route path="/complaints" element={<ProtectedRoute><MyComplaints /></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AppRoutes;
