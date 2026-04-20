'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { ITask, IUser } from '@/types';
import apiClient from '@/lib/apiClient';
import { useAuthStore } from '@/store/authStore';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Textarea from '../ui/Textarea';
import Select from '../ui/Select';
import Button from '../ui/Button';

interface TaskFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (task: ITask) => void;
  editTask?: ITask;
  defaultClientId?: string;
}

export default function TaskForm({
  isOpen, onClose, onSuccess, editTask, defaultClientId,
}: TaskFormProps) {
  const { user } = useAuthStore();
  const [clients, setClients] = useState<IUser[]>([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'medium',
    status: 'todo',
    budgetHours: '',
    estimatedHours: '',
    dueDate: '',
    clientId: defaultClientId ?? '',
    source: 'internal',
    isBillable: true,
    links: [] as { title: string; url: string }[],
  });

  useEffect(() => {
    if (user?.role === 'developer') {
      apiClient.get('/clients').then((res) => {
        if (res.data.success) setClients(res.data.data);
      }).catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    if (editTask) {
      setForm({
        title: editTask.title,
        description: editTask.description ?? '',
        priority: editTask.priority,
        status: editTask.status,
        budgetHours: String(editTask.budgetHours),
        estimatedHours: String(editTask.estimatedHours ?? ''),
        dueDate: editTask.dueDate ? editTask.dueDate.slice(0, 10) : '',
        clientId: typeof editTask.clientId === 'object' ? editTask.clientId._id : editTask.clientId,
        source: editTask.source,
        isBillable: editTask.isBillable,
        links: editTask.links ?? [],
      });
    } else {
      setForm({
        title: '', description: '', priority: 'medium', status: 'todo',
        budgetHours: '', estimatedHours: '', dueDate: '',
        clientId: defaultClientId ?? (user?.role === 'client' ? user._id : ''),
        source: 'internal', isBillable: true, links: [],
      });
    }
  }, [editTask, isOpen, defaultClientId, user]);

  const addLink = () =>
    setForm((f) => ({ ...f, links: [...f.links, { title: '', url: '' }] }));

  const removeLink = (i: number) =>
    setForm((f) => ({ ...f, links: f.links.filter((_, idx) => idx !== i) }));

  const updateLink = (i: number, key: 'title' | 'url', val: string) =>
    setForm((f) => {
      const links = [...f.links];
      links[i] = { ...links[i], [key]: val };
      return { ...f, links };
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.budgetHours) {
      toast.error('Title and budget hours are required');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        budgetHours: parseFloat(form.budgetHours),
        estimatedHours: form.estimatedHours ? parseFloat(form.estimatedHours) : undefined,
        dueDate: form.dueDate || undefined,
        links: form.links.filter((l) => l.url),
      };

      const res = editTask
        ? await apiClient.put(`/tasks/${editTask._id}`, payload)
        : await apiClient.post('/tasks', payload);

      if (res.data.success) {
        toast.success(editTask ? 'Task updated' : 'Task created');
        onSuccess(res.data.data);
        onClose();
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg ?? 'Failed to save task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editTask ? 'Edit Task' : 'New Task'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Task Title *"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          placeholder="What needs to be done?"
        />

        <Textarea
          label="Description"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          placeholder="Describe the task..."
          rows={3}
        />

        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Priority"
            value={form.priority}
            onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
            options={[
              { value: 'low', label: 'Low' },
              { value: 'medium', label: 'Medium' },
              { value: 'high', label: 'High' },
            ]}
          />
          <Select
            label="Status"
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
            options={[
              { value: 'todo', label: 'To Do' },
              { value: 'in-progress', label: 'In Progress' },
              { value: 'done', label: 'Done' },
            ]}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Budget Hours *"
            type="number"
            min="0"
            step="0.5"
            value={form.budgetHours}
            onChange={(e) => setForm((f) => ({ ...f, budgetHours: e.target.value }))}
            placeholder="e.g. 8"
          />
          <Input
            label="Estimated Hours"
            type="number"
            min="0"
            step="0.5"
            value={form.estimatedHours}
            onChange={(e) => setForm((f) => ({ ...f, estimatedHours: e.target.value }))}
            placeholder="Optional"
          />
        </div>

        <Input
          label="Due Date"
          type="date"
          value={form.dueDate}
          onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
        />

        {user?.role === 'developer' && (
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Client *"
              value={form.clientId}
              onChange={(e) => setForm((f) => ({ ...f, clientId: e.target.value }))}
              placeholder="Select client"
              options={clients.map((c) => ({ value: c._id, label: c.name }))}
            />
            <Select
              label="Source"
              value={form.source}
              onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))}
              options={[
                { value: 'internal', label: 'Internal' },
                { value: 'client', label: 'Client' },
                { value: 'call', label: 'Call' },
                { value: 'slack', label: 'Slack' },
              ]}
            />
          </div>
        )}

        {user?.role === 'developer' && (
          <div className="flex items-center gap-3 p-3 bg-white/[0.03] rounded-xl border border-white/[0.06]">
            <input
              type="checkbox"
              id="isBillable"
              checked={form.isBillable}
              onChange={(e) => setForm((f) => ({ ...f, isBillable: e.target.checked }))}
              className="w-4 h-4 accent-indigo-500 rounded"
            />
            <label htmlFor="isBillable" className="text-sm text-slate-300 cursor-pointer">
              Billable task
            </label>
          </div>
        )}

        {/* Links */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-slate-400">Links</label>
            <Button type="button" variant="ghost" size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={addLink}>
              Add Link
            </Button>
          </div>
          {form.links.map((link, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <Input
                placeholder="Label"
                value={link.title}
                onChange={(e) => updateLink(i, 'title', e.target.value)}
                className="flex-shrink-0 w-1/3"
              />
              <Input
                placeholder="https://"
                value={link.url}
                onChange={(e) => updateLink(i, 'url', e.target.value)}
              />
              <button
                type="button"
                onClick={() => removeLink(i)}
                className="p-2 text-slate-500 hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" loading={loading} className="flex-1">
            {editTask ? 'Save Changes' : 'Create Task'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
