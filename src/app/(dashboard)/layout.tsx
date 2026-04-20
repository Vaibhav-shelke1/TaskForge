'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import BottomNav from '@/components/layout/BottomNav';
import Header from '@/components/layout/Header';
import { useAuth } from '@/hooks/useAuth';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, fetchUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) fetchUser();
  }, []);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-[#080c1a] flex items-center justify-center">
        <LoadingSpinner size="lg" label="Loading TrackForge..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080c1a]">
      <Sidebar />
      <div className="lg:pl-64">
        <Header />
        <main className="px-4 sm:px-6 py-6 pb-24 lg:pb-8 max-w-7xl mx-auto">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
