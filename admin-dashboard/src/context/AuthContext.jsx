import React, { createContext, useState, useContext, useEffect } from 'react';
import { adminApi } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [adminUser, setAdminUser] = useState(() => {
    const saved = localStorage.getItem('tcm_admin_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('tcm_admin_token') || '');
  const [loading, setLoading] = useState(false);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const data = await adminApi.login(email, password);
      setToken(data.token);
      setAdminUser(data.user);
      localStorage.setItem('tcm_admin_token', data.token);
      localStorage.setItem('tcm_admin_user', JSON.stringify(data.user));
      return data;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (name, email, password, adminSecret) => {
    setLoading(true);
    try {
      const data = await adminApi.signup(name, email, password, adminSecret);
      setToken(data.token);
      setAdminUser(data.user);
      localStorage.setItem('tcm_admin_token', data.token);
      localStorage.setItem('tcm_admin_user', JSON.stringify(data.user));
      return data;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setAdminUser(null);
    setToken('');
    localStorage.removeItem('tcm_admin_token');
    localStorage.removeItem('tcm_admin_user');
  };

  return (
    <AuthContext.Provider value={{ adminUser, token, login, signup, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
