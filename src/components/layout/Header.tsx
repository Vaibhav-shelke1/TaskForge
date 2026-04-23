'use client';

import { Bell } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { getInitials } from '@/lib/utils';
import AppLogo from '@/components/ui/AppLogo';
import ThemeToggle from '@/components/ui/ThemeToggle';

export default function Header() {
  const { user } = useAuthStore();

  return (
    <header className="lg:hidden sticky top-0 z-30 border-b px-4 py-3"
      style={{ background: 'var(--th-header)', backdropFilter: 'blur(12px)', borderColor: 'var(--th-sidebar-border)' }}>
      <div className="flex items-center justify-between">
        <AppLogo size="sm" showText={true} />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button className="p-2 text-slate-400 hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors">
            <Bell className="w-4 h-4" />
          </button>
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(79,70,229,0.2))', border: '1px solid rgba(124,58,237,0.3)' }}
          >
            <span className="text-xs font-semibold text-violet-300">
              {user ? getInitials(user.name) : '??'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        {subtitle && <p className="text-slate-400 text-sm mt-1">{subtitle}</p>}
      </div>
      {action && <div className="flex items-center gap-3">{action}</div>}
    </div>
  );
}
