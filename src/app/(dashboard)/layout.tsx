'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import BottomNav from '@/components/layout/BottomNav';
import Header from '@/components/layout/Header';
import { useAuth } from '@/hooks/useAuth';
import { AppLoader } from '@/components/ui/LoadingSpinner';

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
    return <AppLoader />;
  }

  return (
    <div className="min-h-screen page-bg">
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
