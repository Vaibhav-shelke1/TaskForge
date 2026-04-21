'use client';

import { useState } from 'react';
import {
  Clock, ExternalLink, Tag, Send, Edit2, Trash2, AlertTriangle,
  CheckCircle2, CircleDollarSign, CalendarClock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { ITask, ITimeLog, IComment } from '@/types';
import {
  formatDate, formatHours, getBudgetPercentage,
  getBudgetStatus, getBudgetBarColor, getPriorityColor,
  getStatusColor, getSourceColor, cn,
  getDueStatus, getDueBadgeStyle, formatDueLabel,
} from '@/lib/utils';
import apiClient from '@/lib/apiClient';
import { useAuthStore } from '@/store/authStore';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Card from '../ui/Card';

interface TaskDetailProps {
  task: ITask;
  timeLogs: ITimeLog[];
  comments: IComment[];
  onEdit: () => void;
  onDelete: () => void;
  onLogTime: () => void;
  onCommentAdded: (comment: IComment) => void;
  onPaymentUpdate: (status: 'pending' | 'paid') => void;
}

export default function TaskDetail({
  task, timeLogs, comments, onEdit, onDelete, onLogTime, onCommentAdded, onPaymentUpdate,
}: TaskDetailProps) {
  const { user } = useAuthStore();
  const [comment, setComment] = useState('');
  const [posting, setPosting] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(task.status);
  const [statusUpdating, setStatusUpdating] = useState(false);

  const budgetPct = getBudgetPercentage(task.totalLoggedHours, task.budgetHours);
  const budgetStatus = getBudgetStatus(task.totalLoggedHours, task.budgetHours);
  const client = typeof task.clientId === 'object' ? task.clientId : null;
  const dueStatus = getDueStatus(task.dueDate, task.status);

  const updateStatus = async (newStatus: ITask['status']) => {
    if (newStatus === currentStatus || statusUpdating) return;
    setStatusUpdating(true);
    const prev = currentStatus;
    setCurrentStatus(newStatus);
    try {
      await apiClient.put(`/tasks/${task._id}`, { ...task, status: newStatus });
      toast.success(`Status → ${newStatus.replace('-', ' ')}`);
    } catch {
      setCurrentStatus(prev);
      toast.error('Failed to update status');
    } finally {
      setStatusUpdating(false);
    }
  };

  const togglePayment = async () => {
    const next = task.paymentStatus === 'paid' ? 'pending' : 'paid';
    setPaymentLoading(true);
    try {
      const res = await apiClient.patch(`/tasks/${task._id}/payment`, { paymentStatus: next });
      if (res.data.success) {
        onPaymentUpdate(next);
        toast.success(next === 'paid' ? 'Payment marked as paid' : 'Payment marked as pending');
      }
    } catch {
      toast.error('Failed to update payment');
    } finally {
      setPaymentLoading(false);
    }
  };

  const postComment = async () => {
    if (!comment.trim()) return;
    setPosting(true);
    try {
      const res = await apiClient.post(`/tasks/${task._id}/comments`, { content: comment });
      if (res.data.success) {
        onCommentAdded(res.data.data as IComment);
        setComment('');
      }
    } catch {
      toast.error('Failed to post comment');
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Task Header Card */}
      <Card>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className={cn('badge text-[11px] uppercase tracking-wide', getPriorityColor(task.priority))}>
                {task.priority}
              </span>
              <span className={cn('badge text-[11px]', getSourceColor(task.source))}>
                {task.source}
              </span>
              {!task.isBillable && (
                <Badge variant="default">non-billable</Badge>
              )}
            </div>
            {/* Quick status switcher */}
            <div className="flex gap-1.5 mb-3">
              {(['todo', 'in-progress', 'done'] as ITask['status'][]).map((s) => (
                <button
                  key={s}
                  onClick={() => updateStatus(s)}
                  disabled={statusUpdating}
                  className={cn(
                    'px-3 py-1 rounded-lg text-xs font-medium transition-all border',
                    currentStatus === s
                      ? s === 'done'
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                        : s === 'in-progress'
                        ? 'bg-violet-500/20 border-violet-500/40 text-violet-400'
                        : 'bg-slate-500/20 border-slate-500/40 text-slate-300'
                      : 'bg-white/[0.03] border-white/[0.06] text-slate-500 hover:text-slate-300 hover:border-white/[0.12]'
                  )}
                >
                  {s === 'in-progress' ? 'In Progress' : s === 'todo' ? 'To Do' : 'Done'}
                </button>
              ))}
            </div>
            <h1 className="text-xl font-bold text-white">{task.title}</h1>
            {task.description && (
              <p className="text-sm text-slate-400 mt-2 leading-relaxed">{task.description}</p>
            )}
          </div>

          {user?.role === 'developer' && (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" icon={<Edit2 className="w-3.5 h-3.5" />} onClick={onEdit}>
                Edit
              </Button>
              <Button variant="danger" size="sm" icon={<Trash2 className="w-3.5 h-3.5" />} onClick={onDelete}>
                Delete
              </Button>
            </div>
          )}
        </div>

        {/* Meta */}
        <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 pt-4 border-t border-white/[0.05] text-xs text-slate-500">
          {client && (
            <span className="flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-indigo-400" />
              {client.name}
              {client.company && ` • ${client.company}`}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            Created {formatDate(task.createdAt)}
          </span>
          {task.dueDate && dueStatus && (
            <span className={cn('flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium', getDueBadgeStyle(dueStatus))}>
              <CalendarClock className="w-3.5 h-3.5" />
              {formatDueLabel(task.dueDate, dueStatus)}
            </span>
          )}
          {task.dueDate && !dueStatus && (
            <span className="flex items-center gap-1.5 text-slate-500">
              <CalendarClock className="w-3.5 h-3.5" />
              Due {formatDate(task.dueDate)}
            </span>
          )}
        </div>
      </Card>

      {/* Budget Card */}
      <Card className={budgetStatus === 'exceeded' ? 'border-red-500/30' : budgetStatus === 'warning' ? 'border-amber-500/20' : ''}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-400" />
            Time Budget
          </h3>
          {budgetStatus !== 'safe' && (
            <AlertTriangle className={cn('w-4 h-4', budgetStatus === 'exceeded' ? 'text-red-400' : 'text-amber-400')} />
          )}
        </div>

        <div className="grid grid-cols-3 gap-3 mb-3">
          {[
            { label: 'Budget', value: formatHours(task.budgetHours), color: 'text-white' },
            { label: 'Logged', value: formatHours(task.totalLoggedHours), color: budgetStatus === 'exceeded' ? 'text-red-400' : 'text-indigo-400' },
            { label: 'Remaining', value: formatHours(Math.max(0, task.budgetHours - task.totalLoggedHours)), color: 'text-emerald-400' },
          ].map((item) => (
            <div key={item.label} className="text-center bg-white/[0.03] rounded-xl p-3">
              <p className={`text-lg font-bold ${item.color}`}>{item.value}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">{item.label}</p>
            </div>
          ))}
        </div>

        <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-500', getBudgetBarColor(budgetStatus))}
            style={{ width: `${Math.min(budgetPct, 100)}%` }}
          />
        </div>
        <p className="text-xs text-slate-500 mt-1.5">{budgetPct}% of budget used</p>

        {user?.role === 'developer' && (
          <Button onClick={onLogTime} className="w-full mt-3" size="sm" icon={<Clock className="w-3.5 h-3.5" />}>
            Log Hours
          </Button>
        )}
      </Card>

      {/* Payment Status */}
      {task.isBillable && (
        <Card className={task.paymentStatus === 'paid' ? 'border-emerald-500/20' : 'border-amber-500/20'}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {task.paymentStatus === 'paid' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <CircleDollarSign className="w-4 h-4 text-amber-400" />
              )}
              <div>
                <h3 className="text-sm font-semibold text-white">Payment</h3>
                <p className={`text-xs mt-0.5 ${task.paymentStatus === 'paid' ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {task.paymentStatus === 'paid' ? 'Payment received' : 'Payment pending'}
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant={task.paymentStatus === 'paid' ? 'ghost' : 'primary'}
              loading={paymentLoading}
              onClick={togglePayment}
              icon={task.paymentStatus === 'paid'
                ? <CircleDollarSign className="w-3.5 h-3.5" />
                : <CheckCircle2 className="w-3.5 h-3.5" />}
            >
              {task.paymentStatus === 'paid' ? 'Mark Pending' : 'Mark as Paid'}
            </Button>
          </div>
        </Card>
      )}

      {/* Links */}
      {task.links && task.links.length > 0 && (
        <Card>
          <h3 className="text-sm font-semibold text-white mb-3">Links</h3>
          <div className="space-y-2">
            {task.links.map((link, i) => (
              <a
                key={i}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                {link.title || link.url}
              </a>
            ))}
          </div>
        </Card>
      )}

      {/* Time Logs */}
      {timeLogs.length > 0 && (
        <Card>
          <h3 className="text-sm font-semibold text-white mb-3">Time Logs</h3>
          <div className="space-y-2">
            {timeLogs.map((log) => (
              <div
                key={log._id}
                className="flex items-start gap-3 p-3 bg-white/[0.03] rounded-xl border border-white/[0.04]"
              >
                <div className="w-10 h-10 rounded-lg bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-indigo-400">{formatHours(log.hours)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium">{log.note || 'Work logged'}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{formatDate(log.date)}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Comments */}
      <Card>
        <h3 className="text-sm font-semibold text-white mb-3">Comments</h3>

        <div className="space-y-3 mb-4">
          {comments.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-3">No comments yet</p>
          ) : (
            comments.map((c) => {
              const author = typeof c.userId === 'object' ? c.userId : null;
              return (
                <div key={c._id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/20 flex items-center justify-center flex-shrink-0 text-xs font-semibold text-indigo-300">
                    {author?.name?.[0]?.toUpperCase() ?? '?'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-white">{author?.name ?? 'Unknown'}</span>
                      <span className="text-[10px] text-slate-600">{formatDate(c.createdAt)}</span>
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed">{c.content}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="flex gap-2 pt-3 border-t border-white/[0.05]">
          <input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); postComment(); } }}
            placeholder="Add a comment..."
            className="flex-1 bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
          <button
            onClick={postComment}
            disabled={!comment.trim() || posting}
            className="p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </Card>
    </div>
  );
}
