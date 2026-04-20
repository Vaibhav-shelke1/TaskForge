'use client';

import { useEffect, useState } from 'react';
import { Plus, Search, Filter, Clock } from 'lucide-react';
import { ITask, IUser } from '@/types';
import apiClient from '@/lib/apiClient';
import { useAuthStore } from '@/store/authStore';
import TaskCard from '@/components/tasks/TaskCard';
import TaskForm from '@/components/tasks/TaskForm';
import TimeLogForm from '@/components/time/TimeLogForm';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import { PageLoader } from '@/components/ui/LoadingSpinner';

export default function TasksPage() {
  const { user } = useAuthStore();
  const [tasks, setTasks] = useState<ITask[]>([]);
  const [clients, setClients] = useState<IUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showLogForm, setShowLogForm] = useState(false);

  const [filters, setFilters] = useState({
    search: '',
    status: '',
    priority: '',
    source: '',
    clientId: '',
  });

  const isDeveloper = user?.role === 'developer';

  const fetchTasks = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.status) params.set('status', filters.status);
      if (filters.priority) params.set('priority', filters.priority);
      if (filters.source) params.set('source', filters.source);
      if (filters.clientId) params.set('clientId', filters.clientId);
      if (filters.search) params.set('search', filters.search);

      const res = await apiClient.get(`/tasks?${params}`);
      if (res.data.success) setTasks(res.data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [filters]);

  useEffect(() => {
    if (isDeveloper) {
      apiClient.get('/clients').then((res) => {
        if (res.data.success) setClients(res.data.data);
      }).catch(() => {});
    }
  }, [isDeveloper]);

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{isDeveloper ? 'All Tasks' : 'My Tasks'}</h1>
          <p className="text-slate-500 text-sm mt-1">{tasks.length} task{tasks.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-2">
          {isDeveloper && (
            <Button size="sm" variant="ghost" icon={<Clock className="w-4 h-4" />} onClick={() => setShowLogForm(true)}>
              Log Hours
            </Button>
          )}
          <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setShowTaskForm(true)}>
            New Task
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
              placeholder="Search tasks..."
              className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <Select
            value={filters.status}
            onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
            placeholder="All Statuses"
            options={[
              { value: 'todo', label: 'To Do' },
              { value: 'in-progress', label: 'In Progress' },
              { value: 'done', label: 'Done' },
            ]}
            className="sm:w-36"
          />
          <Select
            value={filters.priority}
            onChange={(e) => setFilters((f) => ({ ...f, priority: e.target.value }))}
            placeholder="All Priorities"
            options={[
              { value: 'high', label: 'High' },
              { value: 'medium', label: 'Medium' },
              { value: 'low', label: 'Low' },
            ]}
            className="sm:w-36"
          />
          {isDeveloper && (
            <>
              <Select
                value={filters.source}
                onChange={(e) => setFilters((f) => ({ ...f, source: e.target.value }))}
                placeholder="All Sources"
                options={[
                  { value: 'client', label: 'Client' },
                  { value: 'call', label: 'Call' },
                  { value: 'slack', label: 'Slack' },
                  { value: 'internal', label: 'Internal' },
                ]}
                className="sm:w-36"
              />
              <Select
                value={filters.clientId}
                onChange={(e) => setFilters((f) => ({ ...f, clientId: e.target.value }))}
                placeholder="All Clients"
                options={clients.map((c) => ({ value: c._id, label: c.name }))}
                className="sm:w-36"
              />
            </>
          )}
          {(filters.status || filters.priority || filters.source || filters.clientId || filters.search) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFilters({ search: '', status: '', priority: '', source: '', clientId: '' })}
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Task Grid */}
      {tasks.length === 0 ? (
        <div className="text-center py-16">
          <Filter className="w-10 h-10 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 font-medium">No tasks found</p>
          <p className="text-slate-600 text-sm mt-1">
            {Object.values(filters).some(Boolean) ? 'Try adjusting your filters' : 'Create your first task to get started'}
          </p>
          <Button
            className="mt-4"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setShowTaskForm(true)}
          >
            Create Task
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {tasks.map((task) => (
            <TaskCard key={task._id} task={task} showClient={isDeveloper} />
          ))}
        </div>
      )}

      {/* Floating button (mobile) */}
      {isDeveloper && (
        <button
          onClick={() => setShowLogForm(true)}
          className="fixed bottom-20 right-4 lg:hidden w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-600/30 z-30"
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
        onSuccess={fetchTasks}
      />
    </div>
  );
}
