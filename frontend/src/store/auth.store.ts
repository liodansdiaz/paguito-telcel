import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthState } from '../types';

interface AuthStore extends AuthState {
  login: (user: AuthState['user'], accessToken: string, refreshToken: string) => void;
  logout: () => void;
  updateToken: (accessToken: string) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      login: (user, accessToken, refreshToken) => {
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        set({ user, accessToken, refreshToken, isAuthenticated: true });
      },

      logout: () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
      },

      updateToken: (accessToken) => {
        localStorage.setItem('accessToken', accessToken);
        set({ accessToken });
      },
    }),
    {
      name: 'paguito-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
