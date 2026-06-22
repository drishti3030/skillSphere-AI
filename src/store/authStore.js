import { create } from 'zustand';
import { authAPI } from '../api/client';

const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('splatform_token') || null,
  isLoading: false,
  isAuthenticated: !!localStorage.getItem('splatform_token'),

  login: (token, user) => {
    localStorage.setItem('splatform_token', token);
    localStorage.setItem('splatform_user', JSON.stringify(user));
    set({ token, user, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('splatform_token');
    localStorage.removeItem('splatform_user');
    set({ token: null, user: null, isAuthenticated: false });
  },

  setUser: (user) => {
    localStorage.setItem('splatform_user', JSON.stringify(user));
    set({ user });
  },

  initialize: async () => {
    const token = localStorage.getItem('splatform_token');
    if (!token) {
      set({ isLoading: false, isAuthenticated: false });
      return;
    }

    set({ isLoading: true });
    try {
      const response = await authAPI.me();
      const user = response.data;
      localStorage.setItem('splatform_user', JSON.stringify(user));
      set({ user, token, isAuthenticated: true, isLoading: false });
    } catch {
      localStorage.removeItem('splatform_token');
      localStorage.removeItem('splatform_user');
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  },
}));

export default useAuthStore;
