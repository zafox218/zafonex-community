import { create } from 'zustand';
import { get, post, setTokens, clearTokens, hasSession } from '@/lib/api';

export const useAuth = create((set, getState) => ({
  user: null,
  loading: true,
  error: null,

  bootstrap: async () => {
    if (!hasSession()) return set({ loading: false });
    try {
      const data = await post('/auth/refresh', { refreshToken: localStorage.getItem('zx_refresh') });
      setTokens(data.accessToken, data.refreshToken);
      set({ user: data.user, loading: false });
    } catch {
      clearTokens();
      set({ user: null, loading: false });
    }
  },

  login: async (email, password) => {
    set({ error: null });
    try {
      const data = await post('/auth/login', { email, password });
      setTokens(data.accessToken, data.refreshToken);
      set({ user: data.user });
      return true;
    } catch (e) {
      set({ error: e.message });
      return false;
    }
  },

  register: async (payload) => {
    set({ error: null });
    try {
      const data = await post('/auth/register', payload);
      setTokens(data.accessToken, data.refreshToken);
      set({ user: data.user });
      return true;
    } catch (e) {
      set({ error: e.message });
      return false;
    }
  },

  logout: async () => {
    try { await post('/auth/logout', { refreshToken: localStorage.getItem('zx_refresh') }); } catch { /* ignore */ }
    clearTokens();
    set({ user: null });
  },

  becomeSeller: async () => {
    const { role } = await post('/users/me/become-seller');
    set({ user: { ...getState().user, role } });
  },

  refreshMe: async () => {
    const data = await get('/auth/me');
    set({ user: data.user });
  },
}));
