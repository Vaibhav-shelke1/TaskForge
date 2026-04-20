'use client';

import { useState, useEffect, useRef } from 'react';
import { Play, Square, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { ITask } from '@/types';
import apiClient from '@/lib/apiClient';
import { cn } from '@/lib/utils';
import Button from '../ui/Button';
import Select from '../ui/Select';

interface TimerProps {
  tasks: ITask[];
  onLogComplete: () => void;
}

export default function Timer({ tasks, onLogComplete }: TimerProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [taskId, setTaskId] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return [h, m, sec].map((v) => String(v).padStart(2, '0')).join(':');
  };

  const start = () => {
    if (!taskId) { toast.error('Select a task first'); return; }
    setIsRunning(true);
    setSeconds(0);
  };

  const stop = async () => {
    if (!taskId) return;
    setIsRunning(false);
    const hours = parseFloat((seconds / 3600).toFixed(2));
    if (hours < 0.01) { toast.error('Timer too short to log'); return; }

    setLoading(true);
    try {
      await apiClient.post('/time-logs', { taskId, hours, note });
      toast.success(`${hours}h logged!`);
      setSeconds(0);
      setNote('');
      onLogComplete();
    } catch {
      toast.error('Failed to save time');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-4 h-4 text-indigo-400" />
        <h3 className="text-sm font-semibold text-white">Timer</h3>
      </div>

      <div
        className={cn(
          'text-4xl font-bold tabular-nums text-center py-4 rounded-xl mb-4',
          'bg-white/[0.03] border border-white/[0.05]',
          isRunning ? 'text-indigo-300' : 'text-slate-400'
        )}
      >
        {formatTime(seconds)}
      </div>

      <Select
        value={taskId}
        onChange={(e) => setTaskId(e.target.value)}
        placeholder="Select task..."
        options={tasks.map((t) => ({ value: t._id, label: t.title }))}
        className="mb-3"
        disabled={isRunning}
      />

      {isRunning && (
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="What are you working on?"
          className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 mb-3"
        />
      )}

      <div className="flex gap-2">
        {!isRunning ? (
          <Button
            onClick={start}
            icon={<Play className="w-4 h-4" />}
            className="flex-1"
            disabled={!taskId}
          >
            Start Timer
          </Button>
        ) : (
          <Button
            onClick={stop}
            loading={loading}
            variant="danger"
            icon={<Square className="w-4 h-4" />}
            className="flex-1"
          >
            Stop & Save
          </Button>
        )}
      </div>
    </div>
  );
}
