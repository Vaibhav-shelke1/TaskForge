'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/apiClient';
import { useAuthStore } from '@/store/authStore';
import { IUser } from '@/types';
import toast from 'react-hot-toast';

export function useAuth() {
  const { user, isLoading, setUser, setLoading, logout: storeLogout } = useAuthStore();
  const router = useRouter();

  const fetchUser = async () => {
    try {
      setLoading(true);
      const { data } = await apiClient.get('/auth/me');
      if (data.success) setUser(data.data as IUser);
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

export function useRequireAuth() {
  const { user, isLoading, fetchUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user && !isLoading) {
      fetchUser();
    }
  }, []);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading]);

  return { user, isLoading };
}
