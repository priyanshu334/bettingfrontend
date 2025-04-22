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
        
        // Store token in localStorage for API requests
        localStorage.setItem('authToken', data.token);
      },
      
      logout: () => {
        set({
          token: null,
          user: null,
          isAuthenticated: false,
        });
        
        // Remove token from localStorage
        localStorage.removeItem('authToken');
      },
      
      updateUserBalance: (newBalance) => {
        set((state) => ({
          user: state.user ? { ...state.user, money: newBalance } : null,
        }));
      },
    }),
    {
      name: 'auth-storage', // name for the persisted store
      partialize: (state) => ({ 
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);