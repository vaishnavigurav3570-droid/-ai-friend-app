// ============================================
// Antigravity — Token Store (Zustand)
// ============================================

import { create } from 'zustand';
import { api } from '../services/api';

interface LedgerEntry {
  id: string;
  amount: number;
  balance_after: number;
  type: string;
  description: string | null;
  created_at: string;
}

interface TokenState {
  balance: number;
  streakDays: number;
  history: LedgerEntry[];
  isLoading: boolean;

  fetchBalance: () => Promise<void>;
  fetchHistory: (page?: number) => Promise<void>;
  unlockApp: (lockedAppId: string, durationMinutes: number) => Promise<any>;
}

export const useTokenStore = create<TokenState>((set) => ({
  balance: 0,
  streakDays: 0,
  history: [],
  isLoading: false,

  fetchBalance: async () => {
    try {
      const response = await api.getBalance();
      set({
        balance: response.data.token_balance,
        streakDays: response.data.streak_days,
      });
    } catch (err) {
      console.error('Failed to fetch balance:', err);
    }
  },

  fetchHistory: async (page = 1) => {
    set({ isLoading: true });
    try {
      const response = await api.getHistory({ page: String(page), limit: '20' });
      set({ history: response.data });
    } catch (err) {
      console.error('Failed to fetch history:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  unlockApp: async (lockedAppId, durationMinutes) => {
    set({ isLoading: true });
    try {
      const response = await api.unlockApp({ locked_app_id: lockedAppId, duration_minutes: durationMinutes });
      set({ balance: response.data.new_balance });
      return response.data;
    } finally {
      set({ isLoading: false });
    }
  },
}));
