// ============================================
// Antigravity — Task Store (Zustand)
// ============================================

import { create } from 'zustand';
import { api } from '../services/api';

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: number;
  estimated_minutes: number | null;
  token_reward: number;
  deadline: string | null;
  is_micro_task: boolean;
  parent_task_id: string | null;
  tags: string[];
  subtasks?: Task[];
  created_at: string;
}

interface TaskState {
  tasks: Task[];
  currentTask: (Task & { subtasks: Task[] }) | null;
  isLoading: boolean;
  error: string | null;
  filters: {
    status?: string;
    priority?: string;
    search?: string;
  };

  fetchTasks: (filters?: Record<string, string>) => Promise<void>;
  fetchTask: (id: string) => Promise<void>;
  createTask: (task: Record<string, unknown>) => Promise<Task>;
  completeTask: (id: string) => Promise<any>;
  breakdownTask: (id: string) => Promise<Task[]>;
  deleteTask: (id: string) => Promise<void>;
  setFilters: (filters: Record<string, string | undefined>) => void;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  currentTask: null,
  isLoading: false,
  error: null,
  filters: {},

  fetchTasks: async (filters) => {
    set({ isLoading: true });
    try {
      const params: Record<string, string> = {
        ...get().filters,
        ...filters,
        parent_task_id: 'null', // Top-level tasks only
      };
      // Remove undefined values
      Object.keys(params).forEach((k) => {
        if (params[k] === undefined) delete params[k];
      });
      const response = await api.getTasks(params);
      set({ tasks: response.data, error: null });
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchTask: async (id) => {
    set({ isLoading: true });
    try {
      const response = await api.getTask(id);
      set({ currentTask: response.data, error: null });
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ isLoading: false });
    }
  },

  createTask: async (task) => {
    const response = await api.createTask(task);
    await get().fetchTasks();
    return response.data;
  },

  completeTask: async (id) => {
    const response = await api.completeTask(id);
    await get().fetchTasks();
    return response.data;
  },

  breakdownTask: async (id) => {
    set({ isLoading: true });
    try {
      const response = await api.breakdownTask(id);
      // Refresh current task to show new subtasks
      await get().fetchTask(id);
      return response.data;
    } finally {
      set({ isLoading: false });
    }
  },

  deleteTask: async (id) => {
    await api.deleteTask(id);
    await get().fetchTasks();
  },

  setFilters: (filters) => {
    set({ filters: { ...get().filters, ...filters } });
  },
}));
