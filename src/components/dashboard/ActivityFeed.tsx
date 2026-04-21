'use client';

import { useEffect, useState } from 'react';
import { formatDateTime } from '@/lib/utils';
import { IActivityLog } from '@/types';
import apiClient from '@/lib/apiClient';
import Card from '../ui/Card';
import { Activity } from 'lucide-react';

export default function ActivityFeed() {
  const [logs, setLogs] = useState<IActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get('/activity?limit=50')
      .then((res) => {
        if (res.data.success) setLogs(res.data.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-4 h-4 text-indigo-400" />
        <h3 className="text-sm font-semibold text-white">Recent Activity</h3>
      </div>

      <div className="overflow-y-auto max-h-72 pr-1 scrollbar-thin">
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-2 h-2 rounded-full bg-white/10 mt-1.5 flex-shrink-0" />
                <div className="flex-1 space-y-1">
                  <div className="h-3 bg-white/10 rounded w-3/4" />
                  <div className="h-2.5 bg-white/5 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : logs.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-4">No activity yet</p>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <div key={log._id} className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-300 leading-snug">{log.action}</p>
                  <p className="text-xs text-slate-600 mt-0.5">{formatDateTime(log.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
