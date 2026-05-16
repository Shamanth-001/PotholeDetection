import { create } from 'zustand';

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

export const useNotificationStore = create((set) => ({
  notifications: [
    { id: 1, title: 'Report Verified', desc: 'Your report in Koramangala has been verified.', time: '2m ago', type: 'success', read: false },
    { id: 2, title: 'Welcome to Namma Clean!', desc: 'Start by reporting an issue near you.', time: '1h ago', type: 'info', read: true },
  ],
  addNotification: (n) => set((state) => ({ 
    notifications: [{ id: Date.now(), time: 'Just now', read: false, ...n }, ...state.notifications] 
  })),
  markAllRead: () => set((state) => ({
    notifications: state.notifications.map(n => ({ ...n, read: true }))
  })),
}));

