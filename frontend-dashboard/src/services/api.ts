// ============================================
// Antigravity Web — Robust API Service Client
// (Communicates with port 3001, falls back to localStorage on offline/error)
// ============================================

const API_BASE = 'http://localhost:3001/api';

// ---- Type Definitions ----
export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: number;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped' | 'expired';
  estimated_minutes?: number;
  actual_minutes?: number;
  deadline?: string;
  tags: string[];
  created_at: string;
}

export interface Habit {
  id: string;
  title: string;
  frequency: 'daily' | 'weekdays' | 'weekly' | 'custom';
  custom_days: number[];
  token_reward: number;
  is_active: boolean;
  streak: number;
  last_logged_date?: string;
}

export interface Goal {
  id: string;
  title: string;
  description?: string;
  target_date?: string;
  status: 'active' | 'completed' | 'abandoned';
  color: string;
  progress: number;
}

export interface ShopItem {
  id: string;
  title: string;
  description: string;
  cost: number;
  category: 'entertainment' | 'break' | 'custom';
}

// ---- Local Storage Fallbacks (Mock Data) ----
const MOCK_TASKS: Task[] = [
  { id: '1', title: 'Design the new Antigravity web dashboard', description: 'Make sure it uses vibrant gradients and a rich dark mode.', priority: 5, status: 'in_progress', estimated_minutes: 60, tags: ['Design', 'Frontend'], created_at: new Date().toISOString() },
  { id: '2', title: 'Clean up workspace & organize project files', description: 'Delete temporary folders and unused scripts.', priority: 3, status: 'pending', estimated_minutes: 20, tags: ['Admin'], created_at: new Date().toISOString() },
  { id: '3', title: 'Complete Pomodoro session', description: 'Earn 10 focus tokens.', priority: 4, status: 'completed', estimated_minutes: 25, actual_minutes: 25, tags: ['Focus'], created_at: new Date().toISOString() }
];

const MOCK_HABITS: Habit[] = [
  { id: '1', title: 'Drink 3L of Water', frequency: 'daily', custom_days: [], token_reward: 5, is_active: true, streak: 4, last_logged_date: new Date().toISOString().split('T')[0] },
  { id: '2', title: 'Exercise / Stretch', frequency: 'daily', custom_days: [], token_reward: 10, is_active: true, streak: 0 },
  { id: '3', title: 'Read 10 pages of a book', frequency: 'daily', custom_days: [], token_reward: 5, is_active: true, streak: 2 }
];

const MOCK_GOALS: Goal[] = [
  { id: '1', title: 'Master React & Vite Web Apps', description: 'Build stunning responsive user interfaces.', status: 'active', color: '#00CEC9', progress: 75 },
  { id: '2', title: 'Maintain Healthy Focus Habits', description: 'Perform daily sessions and limit distraction.', status: 'active', color: '#6C5CE7', progress: 40 }
];

const MOCK_SHOP_ITEMS: ShopItem[] = [
  { id: '1', title: '15 Min YouTube / Social Break', description: 'Unlock access to watch some content.', cost: 15, category: 'break' },
  { id: '2', title: '30 Min Video Gaming', description: 'Spend tokens to enjoy playing games guilt-free.', cost: 30, category: 'entertainment' },
  { id: '3', title: 'Order a Nice Coffee', description: 'Indulge in a premium beverage.', cost: 100, category: 'custom' }
];

// Initialize localStorage with mock data if not set
const initStorage = () => {
  if (!localStorage.getItem('ag_tasks')) localStorage.setItem('ag_tasks', JSON.stringify(MOCK_TASKS));
  if (!localStorage.getItem('ag_habits')) localStorage.setItem('ag_habits', JSON.stringify(MOCK_HABITS));
  if (!localStorage.getItem('ag_goals')) localStorage.setItem('ag_goals', JSON.stringify(MOCK_GOALS));
  if (!localStorage.getItem('ag_shop')) localStorage.setItem('ag_shop', JSON.stringify(MOCK_SHOP_ITEMS));
  if (!localStorage.getItem('ag_tokens')) localStorage.setItem('ag_tokens', '150'); // Starter balance
};
initStorage();

// Safe Fetch Wrapper that extracts the actual data array/payload from Supabase backend envelopes
async function safeFetch<T>(url: string, options?: RequestInit, storageKey?: string): Promise<T> {
  try {
    const res = await fetch(url, options);
    if (!res.ok) throw new Error('API server returned error');
    const result = await res.json();
    
    // Normalize wrapped backend envelopes: { success: true, data: [...] }
    const payload = (result && typeof result === 'object' && 'success' in result && 'data' in result)
      ? result.data
      : result;

    if (storageKey) {
      localStorage.setItem(storageKey, JSON.stringify(payload));
    }
    return payload;
  } catch (err) {
    console.warn(`[API Client] Error fetching ${url}. Falling back to localStorage.`);
    if (storageKey) {
      const stored = localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : ([] as unknown as T);
    }
    throw err;
  }
}

export const api = {
  // ---- Tokens API ----
  getTokens: async (): Promise<number> => {
    try {
      const res = await fetch(`${API_BASE}/tokens/balance`);
      if (!res.ok) throw new Error();
      const response = await res.json();
      
      // Support both backend database naming 'token_balance' and frontend fallback 'balance'
      const balance = response?.data?.token_balance ?? response?.balance ?? 0;
      localStorage.setItem('ag_tokens', String(balance));
      return balance;
    } catch {
      return Number(localStorage.getItem('ag_tokens') || '0');
    }
  },

  updateTokens: async (amount: number, reason: string): Promise<number> => {
    try {
      const res = await fetch(`${API_BASE}/tokens/transaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, reason })
      });
      if (!res.ok) throw new Error();
      const response = await res.json();
      const balance = response?.balance ?? response?.data?.token_balance ?? 0;
      localStorage.setItem('ag_tokens', String(balance));
      return balance;
    } catch {
      const current = Number(localStorage.getItem('ag_tokens') || '0');
      const next = Math.max(0, current + amount);
      localStorage.setItem('ag_tokens', String(next));
      return next;
    }
  },

  // ---- Tasks API ----
  getTasks: async (): Promise<Task[]> => {
    return safeFetch<Task[]>(`${API_BASE}/tasks`, undefined, 'ag_tasks');
  },

  createTask: async (task: Partial<Task>): Promise<Task> => {
    try {
      const res = await fetch(`${API_BASE}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task)
      });
      if (!res.ok) throw new Error();
      const response = await res.json();
      const newTask = (response && typeof response === 'object' && 'data' in response) ? response.data : response;
      
      const local = JSON.parse(localStorage.getItem('ag_tasks') || '[]');
      localStorage.setItem('ag_tasks', JSON.stringify([newTask, ...local]));
      return newTask;
    } catch {
      const newTask: Task = {
        id: Math.random().toString(36).substr(2, 9),
        title: task.title || 'Untitled Task',
        description: task.description,
        priority: task.priority || 3,
        status: 'pending',
        estimated_minutes: task.estimated_minutes,
        tags: task.tags || [],
        created_at: new Date().toISOString()
      };
      const local = JSON.parse(localStorage.getItem('ag_tasks') || '[]');
      localStorage.setItem('ag_tasks', JSON.stringify([newTask, ...local]));
      return newTask;
    }
  },

  updateTask: async (id: string, updates: Partial<Task>): Promise<Task> => {
    try {
      // If we are completing a task, use the backend atomic transaction route to trigger token updates
      const isCompleting = updates.status === 'completed';
      const endpoint = isCompleting ? `${API_BASE}/tasks/${id}/complete` : `${API_BASE}/tasks/${id}`;
      const method = isCompleting ? 'POST' : 'PUT';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: isCompleting ? undefined : JSON.stringify(updates)
      });
      if (!res.ok) throw new Error();
      const response = await res.json();
      const updated = (response && typeof response === 'object' && 'data' in response) ? response.data : response;

      const local: Task[] = JSON.parse(localStorage.getItem('ag_tasks') || '[]');
      const index = local.findIndex(t => t.id === id);
      if (index !== -1) local[index] = { ...local[index], ...updated, status: updates.status || local[index].status };
      localStorage.setItem('ag_tasks', JSON.stringify(local));
      return updated;
    } catch {
      const local: Task[] = JSON.parse(localStorage.getItem('ag_tasks') || '[]');
      const index = local.findIndex(t => t.id === id);
      if (index !== -1) {
        local[index] = { ...local[index], ...updates };
        localStorage.setItem('ag_tasks', JSON.stringify(local));
        return local[index];
      }
      throw new Error('Task not found');
    }
  },

  breakdownTask: async (id: string): Promise<Task[]> => {
    try {
      const res = await fetch(`${API_BASE}/ai/breakdown`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task_id: id })
      });
      if (!res.ok) throw new Error();
      const response = await res.json();
      const subtasks = (response && typeof response === 'object' && 'data' in response) ? response.data : response;
      return subtasks;
    } catch {
      const local: Task[] = JSON.parse(localStorage.getItem('ag_tasks') || '[]');
      const parent = local.find(t => t.id === id);
      if (!parent) throw new Error('Task not found');

      const mockSubtasks: Task[] = [
        { id: Math.random().toString(36).substr(2, 9), title: `Research steps for "${parent.title}"`, priority: parent.priority, status: 'pending', estimated_minutes: 15, tags: ['AI-Breakdown'], created_at: new Date().toISOString() },
        { id: Math.random().toString(36).substr(2, 9), title: `Draft preliminary design/code`, priority: parent.priority, status: 'pending', estimated_minutes: 20, tags: ['AI-Breakdown'], created_at: new Date().toISOString() },
        { id: Math.random().toString(36).substr(2, 9), title: `Integrate and verify details`, priority: parent.priority, status: 'pending', estimated_minutes: 15, tags: ['AI-Breakdown'], created_at: new Date().toISOString() }
      ];

      localStorage.setItem('ag_tasks', JSON.stringify([...mockSubtasks, ...local]));
      return mockSubtasks;
    }
  },

  // ---- Habits API ----
  getHabits: async (): Promise<Habit[]> => {
    return safeFetch<Habit[]>(`${API_BASE}/habits`, undefined, 'ag_habits');
  },

  logHabit: async (id: string): Promise<Habit> => {
    try {
      const res = await fetch(`${API_BASE}/habits/${id}/log`, { method: 'POST' });
      if (!res.ok) throw new Error();
      const response = await res.json();
      const updated = (response && typeof response === 'object' && 'data' in response) ? response.data : response;

      const local: Habit[] = JSON.parse(localStorage.getItem('ag_habits') || '[]');
      const index = local.findIndex(h => h.id === id);
      if (index !== -1) local[index] = updated;
      localStorage.setItem('ag_habits', JSON.stringify(local));
      return updated;
    } catch {
      const local: Habit[] = JSON.parse(localStorage.getItem('ag_habits') || '[]');
      const index = local.findIndex(h => h.id === id);
      if (index !== -1) {
        const habit = local[index];
        const todayStr = new Date().toISOString().split('T')[0];
        
        if (habit.last_logged_date !== todayStr) {
          habit.streak += 1;
          habit.last_logged_date = todayStr;
        }
        localStorage.setItem('ag_habits', JSON.stringify(local));
        return habit;
      }
      throw new Error('Habit not found');
    }
  },

  createHabit: async (title: string, reward: number): Promise<Habit> => {
    try {
      const res = await fetch(`${API_BASE}/habits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, token_reward: reward, frequency: 'daily' })
      });
      if (!res.ok) throw new Error();
      const response = await res.json();
      const newHabit = (response && typeof response === 'object' && 'data' in response) ? response.data : response;

      const local = JSON.parse(localStorage.getItem('ag_habits') || '[]');
      localStorage.setItem('ag_habits', JSON.stringify([...local, newHabit]));
      return newHabit;
    } catch {
      const newHabit: Habit = {
        id: Math.random().toString(36).substr(2, 9),
        title,
        frequency: 'daily',
        custom_days: [],
        token_reward: reward,
        is_active: true,
        streak: 0
      };
      const local = JSON.parse(localStorage.getItem('ag_habits') || '[]');
      localStorage.setItem('ag_habits', JSON.stringify([...local, newHabit]));
      return newHabit;
    }
  },

  // ---- Goals API ----
  getGoals: async (): Promise<Goal[]> => {
    return safeFetch<Goal[]>(`${API_BASE}/goals`, undefined, 'ag_goals');
  },

  createGoal: async (title: string, description: string, color: string): Promise<Goal> => {
    try {
      const res = await fetch(`${API_BASE}/goals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, color })
      });
      if (!res.ok) throw new Error();
      const response = await res.json();
      const newGoal = (response && typeof response === 'object' && 'data' in response) ? response.data : response;

      const local = JSON.parse(localStorage.getItem('ag_goals') || '[]');
      localStorage.setItem('ag_goals', JSON.stringify([...local, newGoal]));
      return newGoal;
    } catch {
      const newGoal: Goal = {
        id: Math.random().toString(36).substr(2, 9),
        title,
        description,
        color,
        status: 'active',
        progress: 0
      };
      const local = JSON.parse(localStorage.getItem('ag_goals') || '[]');
      localStorage.setItem('ag_goals', JSON.stringify([...local, newGoal]));
      return newGoal;
    }
  },

  // ---- Shop API ----
  getShopItems: async (): Promise<ShopItem[]> => {
    return safeFetch<ShopItem[]>(`${API_BASE}/shop`, undefined, 'ag_shop');
  },

  buyShopItem: async (id: string): Promise<void> => {
    const items: ShopItem[] = JSON.parse(localStorage.getItem('ag_shop') || '[]');
    const item = items.find(i => i.id === id);
    if (!item) throw new Error('Item not found');

    const currentBalance = await api.getTokens();
    if (currentBalance < item.cost) {
      throw new Error('Insufficient Focus Tokens');
    }

    await api.updateTokens(-item.cost, `Purchased: ${item.title}`);
  },

  // ---- Calendar Blocks API ----
  getCalendarBlocks: async (startDate: string, endDate: string): Promise<any[]> => {
    return safeFetch<any[]>(`${API_BASE}/calendar/blocks?start_date=${startDate}&end_date=${endDate}`, undefined, 'ag_calendar_blocks');
  },

  createCalendarBlock: async (block: { title: string; starts_at: string; ends_at: string; task_id?: string }): Promise<any> => {
    try {
      const res = await fetch(`${API_BASE}/calendar/blocks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(block)
      });
      if (!res.ok) throw new Error();
      const response = await res.json();
      const newBlock = (response && typeof response === 'object' && 'data' in response) ? response.data : response;
      return newBlock;
    } catch {
      const local = JSON.parse(localStorage.getItem('ag_calendar_blocks') || '[]');
      const newBlock = { ...block, id: Math.random().toString() };
      localStorage.setItem('ag_calendar_blocks', JSON.stringify([...local, newBlock]));
      return newBlock;
    }
  },

  deleteCalendarBlock: async (id: string): Promise<void> => {
    try {
      const res = await fetch(`${API_BASE}/calendar/blocks/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
    } catch {
      const local: any[] = JSON.parse(localStorage.getItem('ag_calendar_blocks') || '[]');
      const filtered = local.filter(b => b.id !== id);
      localStorage.setItem('ag_calendar_blocks', JSON.stringify(filtered));
    }
  },

  scheduleWithAI: async (date: string, preferences?: string): Promise<any[]> => {
    try {
      const res = await fetch(`${API_BASE}/ai/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, preferences })
      });
      if (!res.ok) throw new Error();
      const response = await res.json();
      return (response && typeof response === 'object' && 'data' in response) ? response.data : [];
    } catch {
      throw new Error('Failed to reach AI scheduling endpoint');
    }
  },

  toggleShield: async (enabled: boolean, apps: string[]): Promise<any> => {
    try {
      const res = await fetch(`${API_BASE}/shield/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled, apps })
      });
      return await res.json();
    } catch {
      return { success: false, error: 'API offline fallback' };
    }
  }
};
