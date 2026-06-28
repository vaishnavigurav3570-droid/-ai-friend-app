// ============================================
// Antigravity — Vault Store (Zustand)
// ============================================

import { create } from 'zustand';
import { api } from '../services/api';

interface LockedApp {
  id: string;
  package_name: string;
  app_label: string;
  icon_url: string | null;
  unlock_cost: number;
  is_active: boolean;
  daily_limit_minutes: number;
  today_usage_minutes?: number;
}

interface Session {
  id: string;
  locked_app_id: string;
  tokens_spent: number;
  duration_minutes: number;
  started_at: string;
  expires_at: string;
  status: string;
  locked_apps?: {
    app_label: string;
    package_name: string;
    icon_url: string | null;
  };
}

interface VaultState {
  lockedApps: LockedApp[];
  activeSessions: Session[];
  isLoading: boolean;

  fetchApps: () => Promise<void>;
  addApp: (app: Record<string, unknown>) => Promise<void>;
  removeApp: (id: string) => Promise<void>;
  toggleApp: (id: string, isActive: boolean) => Promise<void>;
  fetchSessions: () => Promise<void>;
  endSession: (id: string) => Promise<void>;
}

export const useVaultStore = create<VaultState>((set, get) => ({
  lockedApps: [],
  activeSessions: [],
  isLoading: false,

  fetchApps: async () => {
    set({ isLoading: true });
    try {
      const response = await api.getLockedApps();
      set({ lockedApps: response.data });
    } catch (err) {
      console.error('Failed to fetch locked apps:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  addApp: async (app) => {
    await api.addLockedApp(app);
    await get().fetchApps();
  },

  removeApp: async (id) => {
    await api.removeLockedApp(id);
    await get().fetchApps();
  },

  toggleApp: async (id, isActive) => {
    await api.updateLockedApp(id, { is_active: isActive });
    await get().fetchApps();
  },

  fetchSessions: async () => {
    try {
      const response = await api.getActiveSessions();
      set({ activeSessions: response.data });
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
    }
  },

  endSession: async (id) => {
    await api.endSession(id);
    await get().fetchSessions();
  },
}));
