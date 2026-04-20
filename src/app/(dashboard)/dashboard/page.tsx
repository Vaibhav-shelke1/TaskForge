'use client';

import { useEffect, useState } from 'react';
import {
  Users, CheckSquare, Clock, TrendingUp, AlertTriangle, Plus,
} from 'lucide-react';
import { ITask, IUser, IDashboardStats } from '@/types';
import apiClient from '@/lib/apiClient';
import { useAuthStore } from '@/store/authStore';
import { formatHours, getBudgetStatus } from '@/lib/utils';
import StatsCard from '@/components/dashboard/StatsCard';
import ActivityFeed from '@/components/dashboard/ActivityFeed';
import TaskCard from '@/components/tasks/TaskCard';
import ClientCard from '@/components/clients/ClientCard';
import TaskForm from '@/components/tasks/TaskForm';
import TimeLogForm from '@/components/time/TimeLogForm';
import Button from '@/components/ui/Button';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { startOfWeek, endOfWeek } from 'date-fns';
import { toISODateString } from '@/lib/utils';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [tasks, setTasks] = useState<ITask[]>([]);
  const [clients, setClients] = useState<IUser[]>([]);
  const [stats, setStats] = useState<IDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showLogForm, setShowLogForm] = useState(false);

  const isDeveloper = user?.role === 'developer';

  const fetchData = async () => {
    try {
      const [tasksRes, logsRes] = await Promise.all([
        apiClient.get('/tasks'),
        apiClient.get(
          `/time-logs?from=${toISODateString(startOfWeek(new Date()))}&to=${toISODateString(endOfWeek(new Date()))}&limit=200`
        ),
      ]);

      const allTasks: ITask[] = tasksRes.data.data ?? [];
      setTasks(allTasks);

      let clientCount = 0;
      if (isDeveloper) {
        const clientsRes = await apiClient.get('/clients');
        const clientsData = clientsRes.data.data ?? [];
        setClients(clientsData);
        clientCount = clientsData.length;
      }

      const weekLogs = logsRes.data.data ?? [];
      const weekHours = weekLogs.reduce((s: number, l: { hours: number }) => s + l.hours, 0);

      const allTimeLogs = await apiClient.get('/time-logs?limit=1000');
      const allLogsData = allTimeLogs.data.data ?? [];
      const totalHours = allLogsData.reduce((s: number, l: { hours: number }) => s + l.hours, 0);

      const billableHours = allLogsData
        .filter((l: { taskId: ITask | string }) => {
          const t = typeof l.taskId === 'object' ? l.taskId : null;
          return t?.isBillable;
        })
        .reduce((s: number, l: { hours: number }) => s + l.hours, 0);

      const overBudgetTasks = allTasks.filter((t) => getBudgetStatus(t.totalLoggedHours, t.budgetHours) === 'exceeded').length;

      const tasksByStatus = {
        todo: allTasks.filter((t) => t.status === 'todo').length,
        inProgress: allTasks.filter((t) => t.status === 'in-progress').length,
        done: allTasks.filter((t) => t.status === 'done').length,
      };

      setStats({
        totalClients: isDeveloper ? clientCount : undefined,
        totalTasks: allTasks.length,
        totalHoursThisWeek: weekHours,
        totalHoursAllTime: totalHours,
        billableHours,
        nonBillableHours: totalHours - billableHours,
        overBudgetTasks,
        tasksByStatus,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const recentTasks = tasks.slice(0, 6);
  const overBudgetTasks = tasks.filter((t) => getBudgetStatus(t.totalLoggedHours, t.budgetHours) === 'exceeded');

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},{' '}
            <span className="text-gradient">{user?.name?.split(' ')[0]}</span>
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {isDeveloper ? "Here's what's happening across your projects" : "Here's your project overview"}
          </p>
        </div>
        {isDeveloper && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              icon={<Clock className="w-4 h-4" />}
              onClick={() => setShowLogForm(true)}
            >
              Log Hours
            </Button>
            <Button
              size="sm"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => setShowTaskForm(true)}
            >
              New Task
            </Button>
          </div>
        )}
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {isDeveloper && stats.totalClients !== undefined && (
            <StatsCard
              label="Clients"
              value={stats.totalClients}
              icon={Users}
              color="purple"
            />
          )}
          <StatsCard
            label="Total Tasks"
            value={stats.totalTasks}
            icon={CheckSquare}
            sub={`${stats.tasksByStatus.inProgress} in progress`}
            color="indigo"
          />
          <StatsCard
            label="Hours This Week"
            value={formatHours(stats.totalHoursThisWeek)}
            icon={Clock}
            sub={`${formatHours(stats.totalHoursAllTime)} all time`}
            color="blue"
          />
          {isDeveloper && (
            <StatsCard
              label="Billable Hours"
              value={formatHours(stats.billableHours)}
              icon={TrendingUp}
              sub={`${formatHours(stats.nonBillableHours)} non-billable`}
              color="emerald"
            />
          )}
          {stats.overBudgetTasks > 0 && (
            <StatsCard
              label="Over Budget"
              value={stats.overBudgetTasks}
              icon={AlertTriangle}
              sub="tasks need attention"
              color="red"
            />
          )}
        </div>
      )}

      {/* Task Status Bar */}
      {stats && (
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white mb-3">Task Progress</h3>
          <div className="flex gap-3 mb-2 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-500" />
              {stats.tasksByStatus.todo} To Do
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              {stats.tasksByStatus.inProgress} In Progress
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              {stats.tasksByStatus.done} Done
            </span>
          </div>
          <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
            {stats.totalTasks > 0 && [
              { count: stats.tasksByStatus.todo, color: 'bg-slate-600' },
              { count: stats.tasksByStatus.inProgress, color: 'bg-blue-500' },
              { count: stats.tasksByStatus.done, color: 'bg-emerald-500' },
            ].map((bar, i) => bar.count > 0 && (
              <div
                key={i}
                className={`${bar.color} transition-all duration-500`}
                style={{ width: `${(bar.count / stats.totalTasks) * 100}%` }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Over Budget Alert */}
      {overBudgetTasks.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <h3 className="text-sm font-semibold text-red-300">
              {overBudgetTasks.length} task{overBudgetTasks.length !== 1 ? 's' : ''} over budget
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {overBudgetTasks.slice(0, 3).map((task) => (
              <TaskCard key={task._id} task={task} showClient={isDeveloper} />
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent Tasks */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-white">Recent Tasks</h2>
            <a href="/tasks" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
              View all →
            </a>
          </div>
          {recentTasks.length === 0 ? (
            <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-8 text-center">
              <CheckSquare className="w-8 h-8 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">No tasks yet</p>
              {isDeveloper && (
                <Button
                  size="sm"
                  className="mt-3"
                  icon={<Plus className="w-3.5 h-3.5" />}
                  onClick={() => setShowTaskForm(true)}
                >
                  Create First Task
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {recentTasks.map((task) => (
                <TaskCard key={task._id} task={task} showClient={isDeveloper} />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          {/* Activity Feed */}
          <ActivityFeed />

          {/* Recent Clients */}
          {isDeveloper && clients.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold text-white">Clients</h2>
                <a href="/clients" className="text-xs text-indigo-400 hover:text-indigo-300">
                  View all →
                </a>
              </div>
              <div className="space-y-3">
                {clients.slice(0, 3).map((client) => (
                  <ClientCard key={client._id} client={client} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Log Button (mobile) */}
      {isDeveloper && (
        <button
          onClick={() => setShowLogForm(true)}
          className="fixed bottom-20 right-4 lg:hidden w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-600/30 z-30 hover:bg-indigo-500 transition-colors"
        >
          <Clock className="w-6 h-6 text-white" />
        </button>
      )}

      <TaskForm
        isOpen={showTaskForm}
        onClose={() => setShowTaskForm(false)}
        onSuccess={(task) => setTasks((prev) => [task, ...prev])}
      />
      <TimeLogForm
        isOpen={showLogForm}
        onClose={() => setShowLogForm(false)}
        onSuccess={fetchData}
      />
    </div>
  );
}
