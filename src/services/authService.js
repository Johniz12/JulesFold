import { supabase, isSupabaseConfigured } from './supabase';
import { STORAGE_KEYS, getStored, setStored } from './mockStorage';

export const authService = {
  /**
   * Register a new student.
   * Public registration ALWAYS assigns the 'student' role.
   */
  async register({ email, password, fullName }) {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) throw error;
      return { user: data.user, session: data.session };
    }

    // Mock Mode Registration
    const users = getStored(STORAGE_KEYS.USERS, []);
    const existing = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      throw new Error('A user with this email address already exists.');
    }

    const newUser = {
      id: `user-${Date.now()}`,
      email: email.trim().toLowerCase(),
      password,
      full_name: fullName.trim(),
      role: 'student', // ALWAYS student!
      created_at: new Date().toISOString(),
    };

    users.push(newUser);
    setStored(STORAGE_KEYS.USERS, users);
    setStored(STORAGE_KEYS.CURRENT_USER, newUser);

    return { user: newUser, session: { access_token: 'mock-token' } };
  },

  /**
   * Authenticate user with email and password.
   */
  async login({ email, password }) {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      return { user: data.user, session: data.session };
    }

    // Mock Mode Login
    const users = getStored(STORAGE_KEYS.USERS, []);
    const user = users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );

    if (!user) {
      throw new Error('Invalid email or password.');
    }

    setStored(STORAGE_KEYS.CURRENT_USER, user);
    return { user, session: { access_token: 'mock-token' } };
  },

  /**
   * Terminate current session.
   */
  async logout() {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return;
    }

    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  },

  /**
   * Fetch current session.
   */
  async getSession() {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      return data.session;
    }

    const current = getStored(STORAGE_KEYS.CURRENT_USER, null);
    return current ? { user: current } : null;
  },

  /**
   * Fetch profile data (including role).
   */
  async getProfile(userId) {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data;
    }

    const users = getStored(STORAGE_KEYS.USERS, []);
    const user = users.find((u) => u.id === userId);
    return user || null;
  },

  /**
   * Fetch all registered students (Administrator only)
   */
  async getStudents() {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'student')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }

    const users = getStored(STORAGE_KEYS.USERS, []);
    return users.filter((u) => u.role === 'student');
  },

  /**
   * Quick role-switch helper for offline demonstration/testing mode
   */
  switchMockAccount(role) {
    if (isSupabaseConfigured) return;
    const users = getStored(STORAGE_KEYS.USERS, []);
    const target = users.find((u) => u.role === role);
    if (target) {
      setStored(STORAGE_KEYS.CURRENT_USER, target);
      return target;
    }
  },
};
