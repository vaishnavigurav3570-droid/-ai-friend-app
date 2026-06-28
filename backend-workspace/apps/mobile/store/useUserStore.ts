// ============================================
// Antigravity — User Store (Zustand)
// ============================================

import { create } from 'zustand';
import { api } from '../services/api';
import { supabase, signIn, signUp, signOut } from '../services/supabase';

interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  timezone: string;
  token_balance: number;
  streak_days: number;
  longest_streak: number;
  onboarding_complete: boolean;
}

interface UserState {
  profile: Profile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  loadProfile: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  profile: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  initialize: async () => {
    try {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        set({ isAuthenticated: true });
        await get().loadProfile();
      }
    } catch (err) {
      console.error('Init error:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await signIn(email, password);
      if (error) throw error;
      set({ isAuthenticated: true });
      await get().loadProfile();
    } catch (err: any) {
      set({ error: err.message || 'Login failed' });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  register: async (email, password, name) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await signUp(email, password, name);
      if (error) throw error;
      set({ isAuthenticated: true });
      await get().loadProfile();
    } catch (err: any) {
      set({ error: err.message || 'Registration failed' });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    await signOut();
    set({ profile: null, isAuthenticated: false });
  },

  loadProfile: async () => {
    try {
      const response = await api.getProfile();
      set({ profile: response.data });
    } catch (err) {
      console.error('Failed to load profile:', err);
    }
  },

  updateProfile: async (updates) => {
    try {
      const response = await api.updateProfile(updates);
      set({ profile: response.data });
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    }
  },
}));
