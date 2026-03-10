import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthState } from '../types';
import { setTokens, clearTokens, getAccessToken, getRefreshToken } from '../services/api';

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
        // Guardar tokens en memoria del módulo api (no en localStorage)
        setTokens(accessToken, refreshToken);
        set({ user, accessToken, refreshToken, isAuthenticated: true });
      },

      logout: () => {
        // Limpiar tokens de memoria
        clearTokens();
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
      },

      updateToken: (accessToken) => {
        setTokens(accessToken, getRefreshToken());
        set({ accessToken });
      },
    }),
    {
      name: 'paguito-auth',
      // Solo persistir el usuario, NO los tokens (seguridad XSS)
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
