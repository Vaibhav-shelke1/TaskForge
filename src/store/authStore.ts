import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { IUser } from '@/types';

interface AuthStore {
  user: IUser | null;
  isLoading: boolean;
  hasFetched: boolean;
  setUser: (user: IUser | null) => void;
  setLoading: (loading: boolean) => void;
  setHasFetched: (v: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isLoading: false,
      hasFetched: false,
      setUser: (user) => set({ user, hasFetched: true }),
      setLoading: (isLoading) => set({ isLoading }),
      setHasFetched: (hasFetched) => set({ hasFetched }),
      logout: () => set({ user: null, hasFetched: false }),
    }),
    {
      name: 'trackforge-auth',
      partialize: (state) => ({ user: state.user }),
    }
  )
);
