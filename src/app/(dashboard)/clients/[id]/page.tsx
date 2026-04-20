'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Plus, Clock, CheckSquare, Building2, Mail,
  Key, Copy, RefreshCw, ShieldOff, ShieldCheck, CheckCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
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

  // Token state
  const [tokenLoading, setTokenLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showToken, setShowToken] = useState(false);

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

  const generateToken = async () => {
    const confirmed = client?.clientToken
      ? window.confirm('This will invalidate the existing token. The client will need to use the new token. Continue?')
      : true;
    if (!confirmed) return;

    setTokenLoading(true);
    try {
      const res = await apiClient.post(`/clients/${id}/token`);
      if (res.data.success) {
        setClient((prev) => prev ? {
          ...prev,
          clientToken: res.data.data.clientToken,
          clientTokenActive: true,
          clientTokenGeneratedAt: res.data.data.clientTokenGeneratedAt,
        } : prev);
        setShowToken(true);
        toast.success('New access token generated');
      }
    } catch {
      toast.error('Failed to generate token');
    } finally {
      setTokenLoading(false);
    }
  };

  const toggleToken = async (active: boolean) => {
    setTokenLoading(true);
    try {
      const res = await apiClient.patch(`/clients/${id}/token`, { active });
      if (res.data.success) {
        setClient((prev) => prev ? { ...prev, clientTokenActive: active } : prev);
        toast.success(active ? 'Token reactivated' : 'Token expired — client access revoked');
      }
    } catch {
      toast.error('Failed to update token');
    } finally {
      setTokenLoading(false);
    }
  };

  const copyToken = async () => {
    if (!client?.clientToken) return;
    await navigator.clipboard.writeText(client.clientToken);
    setCopied(true);
    toast.success('Token copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading || !client) return <PageLoader />;

  const totalHours = tasks.reduce((s, t) => s + t.totalLoggedHours, 0);
  const totalBudget = tasks.reduce((s, t) => s + t.budgetHours, 0);
  const doneTasks = tasks.filter((t) => t.status === 'done').length;
  const maskedToken = client.clientToken
    ? client.clientToken.slice(0, 7) + '••••••••••••••••••••' + client.clientToken.slice(-4)
    : null;

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
          <Button size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={() => setShowTaskForm(true)}>
            Add Task
          </Button>
        </div>
      </Card>

      {/* ── Access Token Panel ── */}
      <Card className={
        client.clientToken
          ? client.clientTokenActive ? 'border-emerald-500/20' : 'border-red-500/20'
          : ''
      }>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-semibold text-white">Access Token</h3>
            {client.clientToken && (
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                client.clientTokenActive
                  ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20'
                  : 'text-red-400 bg-red-400/10 border-red-400/20'
              }`}>
                {client.clientTokenActive ? 'Active' : 'Expired'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {client.clientToken && (
              client.clientTokenActive ? (
                <Button size="sm" variant="danger" icon={<ShieldOff className="w-3.5 h-3.5" />}
                  loading={tokenLoading} onClick={() => toggleToken(false)}>
                  Expire
                </Button>
              ) : (
                <Button size="sm" variant="ghost" icon={<ShieldCheck className="w-3.5 h-3.5" />}
                  loading={tokenLoading} onClick={() => toggleToken(true)}>
                  Reactivate
                </Button>
              )
            )}
            <Button
              size="sm"
              variant={client.clientToken ? 'ghost' : 'primary'}
              icon={<RefreshCw className="w-3.5 h-3.5" />}
              loading={tokenLoading}
              onClick={generateToken}
            >
              {client.clientToken ? 'Regenerate' : 'Generate Token'}
            </Button>
          </div>
        </div>

        {!client.clientToken ? (
          <p className="text-xs text-slate-500 py-2">
            No token yet. Generate one to let {client.name} log in without a password.
          </p>
        ) : (
          <div className="flex items-center gap-2 p-3 bg-black/30 border border-white/[0.06] rounded-xl">
            <code className="flex-1 text-xs font-mono text-slate-300 break-all select-all">
              {showToken ? client.clientToken : maskedToken}
            </code>
            <button
              onClick={() => setShowToken((v) => !v)}
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors px-2 py-1 rounded-lg hover:bg-white/[0.05] flex-shrink-0"
            >
              {showToken ? 'Hide' : 'Reveal'}
            </button>
            <button
              onClick={copyToken}
              className="p-1.5 text-slate-500 hover:text-indigo-400 transition-colors rounded-lg hover:bg-indigo-400/10 flex-shrink-0"
              title="Copy token"
            >
              {copied ? <CheckCheck className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        )}
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Tasks', value: tasks.length, color: 'text-indigo-400' },
          { label: 'Completed', value: doneTasks, color: 'text-emerald-400' },
          { label: 'Hours Logged', value: formatHours(totalHours), color: 'text-blue-400' },
          { label: 'Budget Total', value: formatHours(totalBudget), color: 'text-purple-400' },
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
