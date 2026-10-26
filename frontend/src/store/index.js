import { create } from 'zustand';
import api from '../services/api';

export const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('civiclens_user') || 'null'),
  token: localStorage.getItem('civiclens_token') || null,
  isAuthenticated: !!localStorage.getItem('civiclens_token'),

  login: (user, token) => {
    localStorage.setItem('civiclens_token', token);
    localStorage.setItem('civiclens_user', JSON.stringify(user));
    set({ user, token, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('civiclens_token');
    localStorage.removeItem('civiclens_user');
    set({ user: null, token: null, isAuthenticated: false });
  },

  updateUser: (user) => {
    localStorage.setItem('civiclens_user', JSON.stringify(user));
    set({ user });
  },
}));

export const useMapStore = create((set) => ({
  center: [12.9716, 77.5946],  // Bangalore
  zoom: 13,
  selectedReport: null,
  filters: { issue_type: null, status: null, urgency: null },
  showHeatmap: false,

  setCenter: (center) => set({ center }),
  setZoom: (zoom) => set({ zoom }),
  selectReport: (report) => set({ selectedReport: report }),
  clearSelection: () => set({ selectedReport: null }),
  setFilter: (key, value) => set((state) => ({ filters: { ...state.filters, [key]: value } })),
  clearFilters: () => set({ filters: { issue_type: null, status: null, urgency: null } }),
  toggleHeatmap: () => set((state) => ({ showHeatmap: !state.showHeatmap })),
}));

export const useReportStore = create((set) => ({
  reports: [],
  loading: false,
  showSubmitModal: false,
  showDuplicateModal: false,
  duplicateReport: null,

  setReports: (reports) => set({ reports }),
  setLoading: (loading) => set({ loading }),
  openSubmitModal: () => set({ showSubmitModal: true }),
  closeSubmitModal: () => set({ showSubmitModal: false }),
  showDuplicate: (report) => set({ showDuplicateModal: true, duplicateReport: report }),
  closeDuplicate: () => set({ showDuplicateModal: false, duplicateReport: null }),
}));

export const useUIStore = create((set) => ({
  language: localStorage.getItem('civiclens_lang') || 'en',
  setLanguage: (lang) => {
    localStorage.setItem('civiclens_lang', lang);
    set({ language: lang });
  },
}));

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,

  fetchNotifications: async () => {
    try {
      set({ loading: true });
      const res = await api.get('/notifications');
      if (res.data?.success && res.data?.data?.notifications) {
        const notifications = res.data.data.notifications;
        const unreadCount = notifications.filter(n => !n.read).length;
        set({ notifications, unreadCount });
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      set({ loading: false });
    }
  },

  addNotification: (n) => set((state) => ({ 
    notifications: [{ id: Date.now(), created_at: new Date().toISOString(), read: false, ...n }, ...state.notifications],
    unreadCount: state.unreadCount + 1
  })),

  markAllRead: async () => {
    try {
      set((state) => ({
        notifications: state.notifications.map(n => ({ ...n, read: true })),
        unreadCount: 0
      }));
      await api.patch('/notifications/read');
    } catch (err) {
      console.error('Failed to mark notifications read:', err);
    }
  },
}));

