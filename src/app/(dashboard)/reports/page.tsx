'use client';

import { useEffect, useState } from 'react';
import { BarChart2 } from 'lucide-react';
import { IUser } from '@/types';
import apiClient from '@/lib/apiClient';
import { useAuthStore } from '@/store/authStore';
import ReportGenerator from '@/components/reports/ReportGenerator';
import { PageLoader } from '@/components/ui/LoadingSpinner';

export default function ReportsPage() {
  const { user } = useAuthStore();
  const [clients, setClients] = useState<IUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role === 'developer') {
      apiClient.get('/clients')
        .then((res) => {
          if (res.data.success) setClients(res.data.data);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user]);

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
            <BarChart2 className="w-4 h-4 text-indigo-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Reports</h1>
        </div>
        <p className="text-slate-500 text-sm">
          Generate professional time-based reports by date range
        </p>
      </div>

      <ReportGenerator clients={clients} />
    </div>
  );
}
