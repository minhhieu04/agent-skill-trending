import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../api/client';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, displayName?: string) => Promise<void>;
  logout: () => void;
  allUsers: User[];
  refreshUsers: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const token = localStorage.getItem('agent_trending_token');
      const savedUser = localStorage.getItem('agent_trending_user');
      if (token && savedUser) {
        return JSON.parse(savedUser);
      }
    } catch {
      // Ignore parse error
    }
    return null;
  });
  const [loading, setLoading] = useState<boolean>(() => {
    // If we already have a cached token & user, don't show full loading gate on refresh
    const token = localStorage.getItem('agent_trending_token');
    return Boolean(token && !localStorage.getItem('agent_trending_user'));
  });
  const [allUsers, setAllUsers] = useState<User[]>([]);

  const fetchCurrentUser = async () => {
    const token = localStorage.getItem('agent_trending_token');
    if (!token) {
      setUser(null);
      localStorage.removeItem('agent_trending_user');
      setLoading(false);
      return;
    }
    try {
      const me = await api.getMe();
      setUser(me);
      localStorage.setItem('agent_trending_user', JSON.stringify(me));
      if (me.is_admin) {
        fetchUsers();
      }
    } catch (err: any) {
      // ONLY clear credentials if backend explicitly responds with 401 Unauthorized
      // Do NOT log out on network hiccup or temporary server restart during F5
      if (err?.status === 401 || err?.message === 'Unauthenticated') {
        localStorage.removeItem('agent_trending_token');
        localStorage.removeItem('agent_trending_user');
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    const token = localStorage.getItem('agent_trending_token');
    if (!token) return;
    try {
      const users = await api.getAllUsers();
      setAllUsers(users);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchCurrentUser();

    const handleUnauthorized = () => {
      setUser(null);
      setAllUsers([]);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, []);

  const login = async (username: string, password: string) => {
    const res = await api.login(username, password);
    setUser(res.user);
    localStorage.setItem('agent_trending_user', JSON.stringify(res.user));
    if (res.user.is_admin) {
      fetchUsers();
    }
  };

  const register = async (username: string, password: string, displayName?: string) => {
    const res = await api.register(username, password, displayName);
    setUser(res.user);
    localStorage.setItem('agent_trending_user', JSON.stringify(res.user));
    if (res.user.is_admin) {
      fetchUsers();
    }
  };

  const logout = () => {
    api.logout();
    localStorage.removeItem('agent_trending_user');
    setUser(null);
    setAllUsers([]);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        allUsers,
        refreshUsers: () => {
          if (user?.is_admin) {
            fetchUsers();
          }
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
