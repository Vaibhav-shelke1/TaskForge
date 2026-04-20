'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Clock, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { ITimeLog, ITask } from '@/types';
import apiClient from '@/lib/apiClient';
import { formatDate, formatHours } from '@/lib/utils';
import TimeLogForm from '@/components/time/TimeLogForm';
import Timer from '@/components/time/Timer';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { PageLoader } from '@/components/ui/LoadingSpinner';

export default function TimeLogsPage() {
  const [logs, setLogs] = useState<ITimeLog[]>([]);
  const [tasks, setTasks] = useState<ITask[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    try {
      const [logsRes, tasksRes] = await Promise.all([
        apiClient.get('/time-logs?limit=100'),
        apiClient.get('/tasks'),
      ]);
      if (logsRes.data.success) setLogs(logsRes.data.data);
      if (tasksRes.data.success) setTasks(tasksRes.data.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const deleteLog = async (id: string) => {
    setDeletingId(id);
    try {
      await apiClient.delete(`/time-logs/${id}`);
      setLogs((prev) => prev.filter((l) => l._id !== id));
      toast.success('Time log deleted');
    } catch {
      toast.error('Failed to delete');
    } finally {
      setDeletingId(null);
    }
  };

  const totalHours = logs.reduce((s, l) => s + l.hours, 0);

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Time Logs</h1>
          <p className="text-slate-500 text-sm mt-1">
            {logs.length} entries • {formatHours(totalHours)} total
          </p>
        </div>
        <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowForm(true)}>
          Log Hours
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Logs List */}
        <div className="lg:col-span-2 space-y-3">
          {logs.length === 0 ? (
            <Card className="text-center py-12">
              <Clock className="w-10 h-10 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 font-medium">No time logs yet</p>
              <Button
                size="sm"
                className="mt-4"
                icon={<Plus className="w-3.5 h-3.5" />}
                onClick={() => setShowForm(true)}
              >
                Log First Hours
              </Button>
            </Card>
          ) : (
            logs.map((log) => {
              const task = typeof log.taskId === 'object' ? log.taskId : null;
              return (
                <div
                  key={log._id}
                  className="flex items-start gap-4 p-4 bg-white/[0.04] border border-white/[0.08] rounded-2xl hover:bg-white/[0.06] transition-colors group"
                >
                  <div className="w-12 h-12 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex flex-col items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-indigo-300">{log.hours}</span>
                    <span className="text-[9px] text-indigo-400/70 uppercase">hrs</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-white truncate">
                          {task?.title ?? 'Unknown Task'}
                        </p>
                        {log.note && (
                          <p className="text-xs text-slate-400 mt-0.5 leading-relaxed line-clamp-2">
                            {log.note}
                          </p>
                        )}
                        <p className="text-xs text-slate-600 mt-1">{formatDate(log.date)}</p>
                      </div>
                      <button
                        onClick={() => deleteLog(log._id)}
                        disabled={deletingId === log._id}
                        className="p-1.5 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-red-400/10"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Timer */}
        <div>
          <Timer tasks={tasks} onLogComplete={fetchLogs} />

          {/* Summary */}
          <Card className="mt-4">
            <h3 className="text-sm font-semibold text-white mb-3">Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">Total logged</span>
                <span className="text-sm font-bold text-white">{formatHours(totalHours)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">Total entries</span>
                <span className="text-sm font-bold text-white">{logs.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">Avg per entry</span>
                <span className="text-sm font-bold text-white">
                  {logs.length ? formatHours(totalHours / logs.length) : '0h'}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* FAB */}
      <button
        onClick={() => setShowForm(true)}
        className="fixed bottom-20 right-4 lg:hidden w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-600/30 z-30"
      >
        <Plus className="w-6 h-6 text-white" />
      </button>

      <TimeLogForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSuccess={fetchLogs}
      />
    </div>
  );
}
