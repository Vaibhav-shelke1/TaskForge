'use client';

import { useEffect, useState } from 'react';
import {
  Users, CheckSquare, Clock, TrendingUp, AlertTriangle, Plus,
  CalendarClock, CircleDollarSign, CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';
import { ITask, IUser, IDashboardStats } from '@/types';
import apiClient from '@/lib/apiClient';
import { useAuthStore } from '@/store/authStore';
import { formatHours, getBudgetStatus, getDueStatus } from '@/lib/utils';
import StatsCard from '@/components/dashboard/StatsCard';
import ActivityFeed from '@/components/dashboard/ActivityFeed';
import DeveloperCard from '@/components/dashboard/DeveloperCard';
import TaskCard from '@/components/tasks/TaskCard';
import ClientCard from '@/components/clients/ClientCard';
import TaskForm from '@/components/tasks/TaskForm';
import TimeLogForm from '@/components/time/TimeLogForm';
import Button from '@/components/ui/Button';
import { PageLoader } from '@/components/ui/LoadingSpinner';

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
      const [tasksRes, statsRes, clientsRes] = await Promise.allSettled([
        apiClient.get('/tasks'),
        apiClient.get('/dashboard/stats'),
        isDeveloper ? apiClient.get('/clients') : Promise.resolve({ data: { data: [] } }),
      ]);

      if (tasksRes.status === 'fulfilled') setTasks(tasksRes.value.data.data ?? []);
      if (clientsRes.status === 'fulfilled' && isDeveloper) setClients(clientsRes.value.data.data ?? []);
      if (statsRes.status === 'fulfilled' && statsRes.value.data.success) setStats(statsRes.value.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const recentTasks = tasks.slice(0, 6);
  const overBudgetTasks = tasks.filter((t) => getBudgetStatus(t.totalLoggedHours, t.budgetHours) === 'exceeded');
  const urgentTasks = tasks.filter((t) => {
    const s = getDueStatus(t.dueDate, t.status);
    return s === 'overdue' || s === 'today' || s === 'soon';
  });

  // Client payment summary
  const billableTasks = tasks.filter((t) => t.isBillable);
  const paidTasks = billableTasks.filter((t) => t.paymentStatus === 'paid');
  const pendingTasks = billableTasks.filter((t) => t.paymentStatus === 'pending');

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
            <StatsCard label="Clients" value={stats.totalClients} icon={Users} color="purple" />
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

      {/* Client: Payment Summary */}
      {!isDeveloper && billableTasks.length > 0 && (
        <div
          className="rounded-2xl p-5"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <CircleDollarSign className="w-4 h-4 text-violet-400" />
            Payment Overview
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <Link
              href="/tasks"
              className="text-center p-3 bg-white/[0.03] rounded-xl border border-white/[0.05] hover:bg-white/[0.06] hover:border-white/[0.1] transition-all"
            >
              <p className="text-xl font-bold text-white">{billableTasks.length}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Total Billable</p>
            </Link>
            <Link
              href="/tasks?paymentStatus=paid"
              className="text-center p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/20 hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-all"
            >
              <p className="text-xl font-bold text-emerald-400">{paidTasks.length}</p>
              <p className="text-[11px] text-slate-500 mt-0.5 flex items-center justify-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Paid
              </p>
            </Link>
            <Link
              href="/tasks?paymentStatus=pending"
              className="text-center p-3 bg-amber-500/5 rounded-xl border border-amber-500/20 hover:bg-amber-500/10 hover:border-amber-500/30 transition-all"
            >
              <p className="text-xl font-bold text-amber-400">{pendingTasks.length}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Pending</p>
            </Link>
          </div>
        </div>
      )}

      {/* Task Status Bar */}
      {stats && (
        <div className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white mb-3">Task Progress</h3>
          <div className="flex gap-4 mb-2 text-xs text-slate-400">
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
          <div className="flex h-2.5 rounded-full overflow-hidden gap-0.5">
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

      {/* Urgent / Due Soon Alert */}
      {urgentTasks.length > 0 && (
        <div className="bg-amber-500/8 border border-amber-500/20 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <CalendarClock className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-amber-300">
              {urgentTasks.length} task{urgentTasks.length !== 1 ? 's' : ''} need attention
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {urgentTasks.slice(0, 3).map((task) => (
              <TaskCard key={task._id} task={task} showClient={isDeveloper} />
            ))}
          </div>
        </div>
      )}

      {/* Over Budget Alert */}
      {overBudgetTasks.length > 0 && (
        <div className="bg-red-500/8 border border-red-500/20 rounded-2xl p-4">
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
            <Link href="/tasks" className="text-xs text-violet-400 hover:text-violet-300 transition-colors">
              View all →
            </Link>
          </div>
          {recentTasks.length === 0 ? (
            <div className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-8 text-center">
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

          {/* Developer contact card (client view) */}
          {!isDeveloper && <DeveloperCard />}

          {/* Recent Clients */}
          {isDeveloper && clients.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold text-white">Clients</h2>
                <Link href="/clients" className="text-xs text-violet-400 hover:text-violet-300">
                  View all →
                </Link>
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
          className="fixed bottom-20 right-4 lg:hidden w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl z-30 transition-all"
          style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', boxShadow: '0 4px 20px rgba(124,58,237,0.4)' }}
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
