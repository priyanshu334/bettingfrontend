import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type User = {
  _id: string;
  fullName: string;
  phone: string;
  money: number;
};

type AuthState = {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (data: { token: string; user: User }) => void;
  logout: () => void;
  updateUserBalance: (newBalance: number) => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,

      login: (data) => {
        set({
          token: data.token,
          user: data.user,
          isAuthenticated: true,
        });

        // LocalStorage for client
        localStorage.setItem('authToken', data.token);

        // Cookie for middleware (client-side)
        document.cookie = `token=${data.token}; path=/; secure; sameSite=lax`;
      },

      logout: () => {
        set({
          token: null,
          user: null,
          isAuthenticated: false,
        });

        // Clean up localStorage
        localStorage.removeItem('authToken');

        // Expire the cookie
        document.cookie = 'token=; path=/; max-age=0';
      },

      updateUserBalance: (newBalance) => {
        set((state) => ({
          user: state.user ? { ...state.user, money: newBalance } : null,
        }));
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
