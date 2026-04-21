import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, parseISO, isValid, isPast, isToday, differenceInDays } from 'date-fns';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(d)) return '—';
    return format(d, 'MMM dd, yyyy');
  } catch {
    return '—';
  }
}

export function formatDateShort(date: string | Date): string {
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(d)) return '—';
    return format(d, 'dd MMM');
  } catch {
    return '—';
  }
}

export function formatDateTime(date: string | Date): string {
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(d)) return '—';
    return format(d, 'MMM dd, yyyy HH:mm');
  } catch {
    return '—';
  }
}

export function formatHours(hours: number): string {
  return `${Number(hours).toFixed(1)}h`;
}

export function getBudgetPercentage(logged: number, budget: number): number {
  if (!budget || budget === 0) return 0;
  return Math.round((logged / budget) * 100);
}

export type BudgetStatus = 'safe' | 'warning' | 'exceeded';

export function getBudgetStatus(logged: number, budget: number, taskStatus?: string): BudgetStatus {
  if (taskStatus === 'done') return 'safe';
  const pct = getBudgetPercentage(logged, budget);
  if (pct > 100) return 'exceeded';
  if (pct >= 80) return 'warning';
  return 'safe';
}

export function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'high':
      return 'text-red-400 bg-red-400/10 border border-red-400/20';
    case 'medium':
      return 'text-amber-400 bg-amber-400/10 border border-amber-400/20';
    case 'low':
      return 'text-emerald-400 bg-emerald-400/10 border border-emerald-400/20';
    default:
      return 'text-slate-400 bg-slate-400/10 border border-slate-400/20';
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'done':
      return 'text-emerald-400 bg-emerald-400/10 border border-emerald-400/20';
    case 'in-progress':
      return 'text-blue-400 bg-blue-400/10 border border-blue-400/20';
    case 'todo':
      return 'text-slate-400 bg-slate-400/10 border border-slate-400/20';
    default:
      return 'text-slate-400 bg-slate-400/10 border border-slate-400/20';
  }
}

export function getSourceColor(source: string): string {
  switch (source) {
    case 'client':
      return 'text-purple-400 bg-purple-400/10 border border-purple-400/20';
    case 'call':
      return 'text-cyan-400 bg-cyan-400/10 border border-cyan-400/20';
    case 'slack':
      return 'text-pink-400 bg-pink-400/10 border border-pink-400/20';
    case 'internal':
      return 'text-indigo-400 bg-indigo-400/10 border border-indigo-400/20';
    default:
      return 'text-slate-400 bg-slate-400/10 border border-slate-400/20';
  }
}

export function getBudgetBarColor(status: BudgetStatus): string {
  switch (status) {
    case 'exceeded':
      return 'bg-red-500';
    case 'warning':
      return 'bg-amber-500';
    default:
      return 'bg-indigo-500';
  }
}

export function truncate(str: string, n: number): string {
  return str.length > n ? str.slice(0, n - 1) + '…' : str;
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function toISODateString(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export type DueStatus = 'overdue' | 'today' | 'soon' | 'upcoming' | null;

export function getDueStatus(dueDate?: string | null, taskStatus?: string): DueStatus {
  if (!dueDate || taskStatus === 'done') return null;
  const d = parseISO(dueDate);
  if (!isValid(d)) return null;
  if (isPast(d) && !isToday(d)) return 'overdue';
  if (isToday(d)) return 'today';
  const days = differenceInDays(d, new Date());
  if (days <= 2) return 'soon';
  return 'upcoming';
}

export function getDueBadgeStyle(status: DueStatus): string {
  switch (status) {
    case 'overdue': return 'text-red-400 bg-red-400/10 border border-red-400/20';
    case 'today': return 'text-amber-400 bg-amber-400/10 border border-amber-400/20';
    case 'soon': return 'text-orange-400 bg-orange-400/10 border border-orange-400/20';
    default: return 'text-slate-400 bg-slate-400/10 border border-slate-400/20';
  }
}

export function formatDueLabel(dueDate: string, status: DueStatus): string {
  if (status === 'today') return 'Due today';
  if (status === 'overdue') {
    const d = parseISO(dueDate);
    const days = differenceInDays(new Date(), d);
    return days === 1 ? 'Overdue 1d' : `Overdue ${days}d`;
  }
  if (status === 'soon') {
    const d = parseISO(dueDate);
    const days = differenceInDays(d, new Date());
    return days === 1 ? 'Due tomorrow' : `Due in ${days}d`;
  }
  try {
    return `Due ${format(parseISO(dueDate), 'MMM dd')}`;
  } catch {
    return 'Due —';
  }
}
