'use client';

import { useRouter } from 'next/navigation';
import apiClient from '@/lib/apiClient';
import { useAuthStore } from '@/store/authStore';
import { IUser } from '@/types';

export function useAuth() {
  const { user, isLoading, hasFetched, setUser, setLoading, logout: storeLogout } = useAuthStore();
  const router = useRouter();

  const fetchUser = async () => {
    // Prevent duplicate concurrent fetches
    if (isLoading || hasFetched) return;
    try {
      setLoading(true);
      const { data } = await apiClient.get('/auth/me');
      if (data.success) setUser(data.data as IUser);
      else setUser(null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // ignore
    } finally {
      storeLogout();
      router.push('/login');
    }
  };

  return { user, isLoading, fetchUser, logout };
}
