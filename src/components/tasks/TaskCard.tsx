'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Clock, AlertTriangle, Tag, ExternalLink, CheckCircle2, CircleDollarSign, CalendarClock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { ITask } from '@/types';
import apiClient from '@/lib/apiClient';
import { useAuthStore } from '@/store/authStore';
import {
  cn, formatDate, formatHours,
  getBudgetPercentage, getBudgetStatus, getBudgetBarColor,
  getPriorityColor, getStatusColor, getSourceColor,
  getDueStatus, getDueBadgeStyle, formatDueLabel,
} from '@/lib/utils';

interface TaskCardProps {
  task: ITask;
  showClient?: boolean;
  onStatusChange?: (taskId: string, newStatus: ITask['status']) => void;
}

const STATUS_CYCLE: Record<ITask['status'], ITask['status']> = {
  'todo': 'in-progress',
  'in-progress': 'done',
  'done': 'todo',
};

const STATUS_OPTIONS: { value: ITask['status']; label: string }[] = [
  { value: 'todo', label: 'To Do' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
];

export default function TaskCard({ task, showClient = false, onStatusChange }: TaskCardProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const [status, setStatus] = useState<ITask['status']>(task.status);
  const [updating, setUpdating] = useState(false);

  const budgetPct = getBudgetPercentage(task.totalLoggedHours, task.budgetHours);
  const budgetStatus = getBudgetStatus(task.totalLoggedHours, task.budgetHours, status);
  const client = typeof task.clientId === 'object' ? task.clientId : null;
  const dueStatus = getDueStatus(task.dueDate, task.status);

  const handleStatusChange = async (e: React.MouseEvent, newStatus: ITask['status']) => {
    e.preventDefault();
    e.stopPropagation();
    if (newStatus === status || updating) return;
    setUpdating(true);
    const prev = status;
    setStatus(newStatus);
    try {
      await apiClient.put(`/tasks/${task._id}`, { ...task, status: newStatus });
      onStatusChange?.(task._id, newStatus);
    } catch {
      setStatus(prev);
      toast.error('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div
      onClick={() => router.push(`/tasks/${task._id}`)}
      className={cn(
        'block bg-white/[0.04] border rounded-2xl p-5 transition-all duration-200 cursor-pointer',
        'hover:bg-white/[0.07] hover:border-white/[0.14] hover:-translate-y-0.5',
        budgetStatus === 'exceeded'
          ? 'border-red-500/30'
          : budgetStatus === 'warning'
          ? 'border-amber-500/20'
          : 'border-white/[0.08]'
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={cn('badge text-[10px] uppercase tracking-wider', getPriorityColor(task.priority))}>
              {task.priority}
            </span>
            {/* Status badge — always visible so clients can see task state */}
            <span className={cn('badge text-[10px]', getStatusColor(status))}>
              {status.replace('-', ' ')}
            </span>
            <span className={cn('badge text-[10px]', getSourceColor(task.source))}>
              {task.source}
            </span>
            {!task.isBillable && (
              <span className="badge text-[10px] text-slate-500 bg-slate-500/10 border-slate-500/20">
                non-billable
              </span>
            )}
          </div>
          <h3 className="text-sm font-semibold text-white leading-snug line-clamp-2">
            {task.title}
          </h3>
        </div>

        {budgetStatus === 'exceeded' && (
          <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
        )}
        {budgetStatus === 'warning' && (
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
        )}
      </div>

      {/* Description */}
      {task.description && (
        <p className="text-xs text-slate-500 mb-3 line-clamp-2 leading-relaxed">
          {task.description}
        </p>
      )}

      {/* Quick Status Buttons */}
      {user?.role === 'developer' && (
        <div className="flex gap-1.5 mb-3" onClick={(e) => e.stopPropagation()}>
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={(e) => handleStatusChange(e, opt.value)}
              disabled={updating}
              className={cn(
                'flex-1 py-1 rounded-lg text-[10px] font-medium transition-all border',
                status === opt.value
                  ? opt.value === 'done'
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                    : opt.value === 'in-progress'
                    ? 'bg-violet-500/20 border-violet-500/40 text-violet-400'
                    : 'bg-slate-500/20 border-slate-500/40 text-slate-300'
                  : 'bg-white/[0.03] border-white/[0.06] text-slate-600 hover:text-slate-400 hover:border-white/[0.12]'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {/* Budget Progress */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Clock className="w-3.5 h-3.5" />
            <span>
              {formatHours(task.totalLoggedHours)} / {formatHours(task.budgetHours)}
            </span>
          </div>
          <span
            className={cn(
              'text-xs font-semibold',
              budgetStatus === 'exceeded'
                ? 'text-red-400'
                : budgetStatus === 'warning'
                ? 'text-amber-400'
                : 'text-slate-400'
            )}
          >
            {budgetPct}%
          </span>
        </div>
        <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500',
              getBudgetBarColor(budgetStatus)
            )}
            style={{ width: `${Math.min(budgetPct, 100)}%` }}
          />
        </div>
        {budgetStatus === 'exceeded' && (
          <p className="text-[10px] text-red-400 mt-1">
            Over budget by {formatHours(task.totalLoggedHours - task.budgetHours)}
          </p>
        )}
      </div>

      {/* Due Date Badge */}
      {dueStatus && task.dueDate && (
        <div className={cn('inline-flex items-center gap-1.5 text-[10px] font-medium rounded-full px-2.5 py-1 mb-2', getDueBadgeStyle(dueStatus))}>
          <CalendarClock className="w-3 h-3" />
          {formatDueLabel(task.dueDate, dueStatus)}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-white/[0.05]">
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-600">{formatDate(task.createdAt)}</span>
          {task.isBillable && (
            task.paymentStatus === 'paid' ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded-full px-2 py-0.5">
                <CheckCircle2 className="w-2.5 h-2.5" /> Paid
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded-full px-2 py-0.5">
                <CircleDollarSign className="w-2.5 h-2.5" /> Payment Pending
              </span>
            )
          )}
        </div>
        {showClient && client && (
          <div className="flex items-center gap-1 text-[11px] text-slate-500">
            <Tag className="w-3 h-3" />
            <span>{typeof client === 'object' ? client.name : ''}</span>
          </div>
        )}
        {task.links && task.links.length > 0 && (
          <div className="flex items-center gap-1 text-[11px] text-indigo-400">
            <ExternalLink className="w-3 h-3" />
            <span>{task.links.length} link{task.links.length !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>
    </div>
  );
}
