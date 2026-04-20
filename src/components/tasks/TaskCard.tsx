'use client';

import Link from 'next/link';
import {
  Clock, AlertTriangle, Tag, ExternalLink,
} from 'lucide-react';
import { ITask } from '@/types';
import {
  cn, formatDate, formatHours,
  getBudgetPercentage, getBudgetStatus, getBudgetBarColor,
  getPriorityColor, getStatusColor, getSourceColor,
} from '@/lib/utils';
import Badge from '../ui/Badge';

interface TaskCardProps {
  task: ITask;
  showClient?: boolean;
}

export default function TaskCard({ task, showClient = false }: TaskCardProps) {
  const budgetPct = getBudgetPercentage(task.totalLoggedHours, task.budgetHours);
  const budgetStatus = getBudgetStatus(task.totalLoggedHours, task.budgetHours);
  const client = typeof task.clientId === 'object' ? task.clientId : null;

  return (
    <Link
      href={`/tasks/${task._id}`}
      className={cn(
        'block bg-white/[0.04] border rounded-2xl p-5 transition-all duration-200',
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
            <span className={cn('badge text-[10px]', getStatusColor(task.status))}>
              {task.status.replace('-', ' ')}
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

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-white/[0.05]">
        <span className="text-[11px] text-slate-600">{formatDate(task.createdAt)}</span>
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
    </Link>
  );
}
