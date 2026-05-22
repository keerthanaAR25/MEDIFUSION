import { create } from 'zustand';
import { User, Patient, AIAnalysis } from '@/lib/types';
import Cookies from 'js-cookie';

interface AppStore {
  user: User | null;
  token: string | null;
  darkMode: boolean;
  currentCase: Patient | null;
  currentAnalysis: AIAnalysis | null;
  notifications: Notification[];
  
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  toggleDarkMode: () => void;
  setCurrentCase: (patient: Patient | null) => void;
  setCurrentAnalysis: (analysis: AIAnalysis | null) => void;
  addNotification: (n: Omit<Notification, 'id'>) => void;
  logout: () => void;
  initFromStorage: () => void;
}

interface Notification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
  timestamp: Date;
}

export const useAppStore = create<AppStore>((set, get) => ({
  user: null,
  token: null,
  darkMode: true,
  currentCase: null,
  currentAnalysis: null,
  notifications: [],

  setUser: (user) => {
    set({ user });
    if (user) Cookies.set('user', JSON.stringify(user), { expires: 1 });
  },
  setToken: (token) => {
    set({ token });
    if (token) Cookies.set('token', token, { expires: 1 });
    else Cookies.remove('token');
  },
  toggleDarkMode: () => set((s) => ({ darkMode: !s.darkMode })),
  setCurrentCase: (currentCase) => set({ currentCase }),
  setCurrentAnalysis: (currentAnalysis) => set({ currentAnalysis }),
  addNotification: (n) => {
    const notif = { ...n, id: Date.now().toString(), timestamp: new Date() };
    set((s) => ({ notifications: [notif, ...s.notifications].slice(0, 20) }));
  },
  logout: () => {
    Cookies.remove('token');
    Cookies.remove('user');
    set({ user: null, token: null, currentCase: null, currentAnalysis: null });
  },
  initFromStorage: () => {
    const token = Cookies.get('token');
    const userStr = Cookies.get('user');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        set({ token, user });
      } catch {}
    }
  },
}));