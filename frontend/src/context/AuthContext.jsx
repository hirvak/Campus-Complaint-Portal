import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refreshUser = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return null;
    }
    try {
      const userData = await api.auth.getCurrentUser();
      setUser(userData);
      return userData;
    } catch (err) {
      console.warn('Failed to load authenticated user session:', err.message);
      api.auth.logout();
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email, password) => {
    setError(null);
    try {
      await api.auth.login({ email, password });
      const userData = await api.auth.getCurrentUser();
      setUser(userData);
      return userData;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const googleLogin = async ({ id_token, role, student_type, department }) => {
    setError(null);
    try {
      await api.auth.googleLogin({ id_token, role, student_type, department });
      const userData = await api.auth.getCurrentUser();
      setUser(userData);
      return userData;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const register = async (userData) => {
    setError(null);
    try {
      const newUser = await api.auth.register(userData);
      return newUser;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const logout = () => {
    api.auth.logout();
    setUser(null);
  };

  const getRoleDashboardPath = (role) => {
    switch (role) {
      case 'Student':
        return '/student/dashboard';
      case 'Faculty':
        return '/faculty/dashboard';
      case 'Administrator':
        return '/admin/dashboard';
      case 'Facility Officer':
        return '/facility-officer/dashboard';
      case 'Maintenance Team':
        return '/maintenance/dashboard';
      default:
        return '/';
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        googleLogin,
        register,
        logout,
        refreshUser,
        getRoleDashboardPath,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
