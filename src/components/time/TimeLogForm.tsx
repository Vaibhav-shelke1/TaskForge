'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { ITask } from '@/types';
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
}

export default function TimeLogForm({
  isOpen, onClose, onSuccess, defaultTaskId,
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

  useEffect(() => {
    if (isOpen) {
      apiClient.get('/tasks').then((res) => {
        if (res.data.success) setTasks(res.data.data);
      }).catch(() => {});
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setForm({
        taskId: defaultTaskId ?? '',
        hours: '',
        note: '',
        date: toISODateString(new Date()),
      });
    }
  }, [isOpen, defaultTaskId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.taskId || !form.hours) {
      toast.error('Task and hours are required');
      return;
    }

    const h = parseFloat(form.hours);
    if (isNaN(h) || h <= 0) {
      toast.error('Hours must be a positive number');
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.post('/time-logs', {
        taskId: form.taskId,
        hours: h,
        note: form.note,
        date: form.date,
      });

      if (res.data.success) {
        toast.success(`${h}h logged successfully`);
        onSuccess();
        onClose();
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg ?? 'Failed to log time');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Log Hours" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
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
            Log Hours
          </Button>
        </div>
      </form>
    </Modal>
  );
}
