'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Clock, CheckSquare, Building2, Mail } from 'lucide-react';
import { IUser, ITask } from '@/types';
import apiClient from '@/lib/apiClient';
import { formatDate, formatHours, getInitials } from '@/lib/utils';
import TaskCard from '@/components/tasks/TaskCard';
import TaskForm from '@/components/tasks/TaskForm';
import Button from '@/components/ui/Button';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import Card from '@/components/ui/Card';

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [client, setClient] = useState<IUser | null>(null);
  const [tasks, setTasks] = useState<ITask[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTaskForm, setShowTaskForm] = useState(false);

  useEffect(() => {
    Promise.all([
      apiClient.get(`/clients/${id}`),
      apiClient.get(`/tasks?clientId=${id}`),
    ])
      .then(([clientRes, tasksRes]) => {
        if (clientRes.data.success) setClient(clientRes.data.data.client);
        if (tasksRes.data.success) setTasks(tasksRes.data.data);
      })
      .catch(() => router.push('/clients'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading || !client) return <PageLoader />;

  const totalHours = tasks.reduce((s, t) => s + t.totalLoggedHours, 0);
  const totalBudget = tasks.reduce((s, t) => s + t.budgetHours, 0);
  const doneTasks = tasks.filter((t) => t.status === 'done').length;

  return (
    <div className="space-y-5">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Clients
      </button>

      {/* Client Profile */}
      <Card>
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center flex-shrink-0">
            <span className="text-xl font-bold text-indigo-300">{getInitials(client.name)}</span>
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white">{client.name}</h1>
            {client.company && (
              <div className="flex items-center gap-1.5 text-sm text-slate-400 mt-1">
                <Building2 className="w-3.5 h-3.5" />
                {client.company}
              </div>
            )}
            <div className="flex items-center gap-1.5 text-sm text-slate-400 mt-0.5">
              <Mail className="w-3.5 h-3.5" />
              {client.email}
            </div>
            <p className="text-xs text-slate-600 mt-2">Member since {formatDate(client.createdAt)}</p>
          </div>
          <Button
            size="sm"
            icon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => setShowTaskForm(true)}
          >
            Add Task
          </Button>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Tasks', value: tasks.length, icon: CheckSquare, color: 'text-indigo-400' },
          { label: 'Completed', value: doneTasks, icon: CheckSquare, color: 'text-emerald-400' },
          { label: 'Hours Logged', value: formatHours(totalHours), icon: Clock, color: 'text-blue-400' },
          { label: 'Budget Total', value: formatHours(totalBudget), icon: Clock, color: 'text-purple-400' },
        ].map((stat) => (
          <Card key={stat.label} className="text-center p-4">
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">{stat.label}</p>
          </Card>
        ))}
      </div>

      {/* Tasks */}
      <div>
        <h2 className="text-base font-semibold text-white mb-3">Tasks</h2>
        {tasks.length === 0 ? (
          <Card className="text-center py-10">
            <p className="text-slate-500 text-sm">No tasks for this client yet</p>
            <Button
              size="sm"
              className="mt-3"
              icon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => setShowTaskForm(true)}
            >
              Add First Task
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {tasks.map((task) => (
              <TaskCard key={task._id} task={task} />
            ))}
          </div>
        )}
      </div>

      <TaskForm
        isOpen={showTaskForm}
        onClose={() => setShowTaskForm(false)}
        onSuccess={(task) => setTasks((prev) => [task, ...prev])}
        defaultClientId={id}
      />
    </div>
  );
}
