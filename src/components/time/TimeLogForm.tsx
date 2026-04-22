'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { ITask, ITimeLog } from '@/types';
import apiClient from '@/lib/apiClient';
import { useAuthStore } from '@/store/authStore';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Textarea from '../ui/Textarea';
import Select from '../ui/Select';
import Button from '../ui/Button';
import { toISODateString } from '@/lib/utils';

interface TimeLogFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultTaskId?: string;
  editLog?: ITimeLog;
}

export default function TimeLogForm({
  isOpen, onClose, onSuccess, defaultTaskId, editLog,
}: TimeLogFormProps) {
  const { user } = useAuthStore();
  const [tasks, setTasks] = useState<ITask[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    taskId: defaultTaskId ?? '',
    hours: '',
    note: '',
    date: toISODateString(new Date()),
  });

  // Load task list for the dropdown (only needed when creating)
  useEffect(() => {
    if (isOpen && !editLog) {
      apiClient.get('/tasks').then((res) => {
        if (res.data.success) setTasks(res.data.data);
      }).catch(() => {});
    }
  }, [isOpen, editLog]);

  // Pre-fill form when creating or editing
  useEffect(() => {
    if (!isOpen) return;
    if (editLog) {
      setForm({
        taskId: typeof editLog.taskId === 'object' ? editLog.taskId._id : String(editLog.taskId),
        hours: String(editLog.hours),
        note: editLog.note ?? '',
        date: editLog.date ? editLog.date.slice(0, 10) : toISODateString(new Date()),
      });
    } else {
      setForm({
        taskId: defaultTaskId ?? '',
        hours: '',
        note: '',
        date: toISODateString(new Date()),
      });
    }
  }, [isOpen, editLog, defaultTaskId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editLog && !form.taskId) {
      toast.error('Please select a task');
      return;
    }
    if (!form.hours) {
      toast.error('Hours are required');
      return;
    }
    const h = parseFloat(form.hours);
    if (isNaN(h) || h <= 0) {
      toast.error('Hours must be a positive number');
      return;
    }

    setLoading(true);
    try {
      let res;
      if (editLog) {
        res = await apiClient.put(`/time-logs/${editLog._id}`, {
          hours: h,
          note: form.note,
          date: form.date,
        });
      } else {
        res = await apiClient.post('/time-logs', {
          taskId: form.taskId,
          hours: h,
          note: form.note,
          date: form.date,
        });
      }

      if (res.data.success) {
        toast.success(editLog ? 'Time log updated' : `${h}h logged successfully`);
        onClose();
        try { onSuccess(); } catch { /* ignore refresh errors */ }
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg ?? (editLog ? 'Failed to update' : 'Failed to log time'));
    } finally {
      setLoading(false);
    }
  };

  const taskName = editLog && typeof editLog.taskId === 'object' ? editLog.taskId.title : null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editLog ? 'Edit Time Log' : 'Log Hours'} size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        {editLog ? (
          /* When editing, show the task name as read-only */
          <div className="px-3 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl">
            <p className="text-[10px] text-slate-500 mb-0.5">Task</p>
            <p className="text-sm text-white font-medium truncate">{taskName ?? 'Unknown task'}</p>
          </div>
        ) : (
          <Select
            label="Task *"
            value={form.taskId}
            onChange={(e) => setForm((f) => ({ ...f, taskId: e.target.value }))}
            placeholder="Select a task"
            options={tasks.map((t) => ({
              value: t._id,
              label: typeof t.clientId === 'object'
                ? `${t.title} — ${t.clientId.name}`
                : t.title,
            }))}
          />
        )}

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Hours *"
            type="number"
            min="0.25"
            step="0.25"
            value={form.hours}
            onChange={(e) => setForm((f) => ({ ...f, hours: e.target.value }))}
            placeholder="e.g. 2.5"
          />
          <Input
            label="Date"
            type="date"
            value={form.date}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
          />
        </div>

        <Textarea
          label="Work Description"
          value={form.note}
          onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
          placeholder="What did you work on?"
          rows={3}
        />

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" loading={loading} className="flex-1">
            {editLog ? 'Save Changes' : 'Log Hours'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
