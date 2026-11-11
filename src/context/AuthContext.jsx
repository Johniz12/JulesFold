import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { isSupabaseConfigured, supabase } from '../services/supabase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize session and listen for auth state transitions
  useEffect(() => {
    let subscription = null;

    const initializeAuth = async () => {
      try {
        setLoading(true);
        if (isSupabaseConfigured && supabase) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            setUser(session.user);
            const userProfile = await authService.getProfile(session.user.id);
            setProfile(userProfile);
          } else {
            setUser(null);
            setProfile(null);
          }

          const { data } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (session?.user) {
              setUser(session.user);
              const userProfile = await authService.getProfile(session.user.id);
              setProfile(userProfile);
            } else {
              setUser(null);
              setProfile(null);
            }
          });
          subscription = data.subscription;
        } else {
          // Mock mode initialization
          const session = await authService.getSession();
          if (session?.user) {
            setUser(session.user);
            setProfile(session.user);
          }
        }
      } catch (err) {
        console.error('Failed to initialize session:', err);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  const login = async (credentials) => {
    setLoading(true);
    try {
      const { user: authedUser } = await authService.login(credentials);
      setUser(authedUser);
      const userProfile = await authService.getProfile(authedUser.id);
      setProfile(userProfile);
      return { user: authedUser, profile: userProfile };
    } finally {
      setLoading(false);
    }
  };

  const register = async (details) => {
    setLoading(true);
    try {
      const result = await authService.register(details);
      setUser(result.user);
      const userProfile = await authService.getProfile(result.user.id);
      setProfile(userProfile);
      return result;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await authService.logout();
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const switchMockUser = (role) => {
    if (!isSupabaseConfigured) {
      const target = authService.switchMockAccount(role);
      if (target) {
        setUser(target);
        setProfile(target);
      }
    }
  };

  const role = profile?.role || (user?.user_metadata?.role) || 'student';
  const isAdmin = role === 'admin';
  const isStudent = role === 'student';

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role,
        isAdmin,
        isStudent,
        loading,
        login,
        register,
        logout,
        switchMockUser,
        isConfigured: isSupabaseConfigured,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
