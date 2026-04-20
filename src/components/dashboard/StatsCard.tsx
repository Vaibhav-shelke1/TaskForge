import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  sub?: string;
  trend?: { value: number; label: string };
  color?: 'indigo' | 'emerald' | 'amber' | 'red' | 'blue' | 'purple';
  className?: string;
}

const colorMap = {
  indigo: {
    icon: 'text-indigo-400',
    bg: 'bg-indigo-400/10',
    glow: 'shadow-indigo-500/10',
  },
  emerald: {
    icon: 'text-emerald-400',
    bg: 'bg-emerald-400/10',
    glow: 'shadow-emerald-500/10',
  },
  amber: {
    icon: 'text-amber-400',
    bg: 'bg-amber-400/10',
    glow: 'shadow-amber-500/10',
  },
  red: {
    icon: 'text-red-400',
    bg: 'bg-red-400/10',
    glow: 'shadow-red-500/10',
  },
  blue: {
    icon: 'text-blue-400',
    bg: 'bg-blue-400/10',
    glow: 'shadow-blue-500/10',
  },
  purple: {
    icon: 'text-purple-400',
    bg: 'bg-purple-400/10',
    glow: 'shadow-purple-500/10',
  },
};

export default function StatsCard({
  label,
  value,
  icon: Icon,
  sub,
  color = 'indigo',
  className,
}: StatsCardProps) {
  const colors = colorMap[color];

  return (
    <div
      className={cn(
        'bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5',
        'transition-all duration-200 hover:bg-white/[0.06] hover:border-white/[0.12]',
        `shadow-lg ${colors.glow}`,
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
            {label}
          </p>
          <p className="text-3xl font-bold text-white">{value}</p>
          {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
        </div>
        <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center', colors.bg)}>
          <Icon className={cn('w-5 h-5', colors.icon)} />
        </div>
      </div>
    </div>
  );
}
