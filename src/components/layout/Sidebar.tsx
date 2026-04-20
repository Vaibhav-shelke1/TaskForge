'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, CheckSquare, Clock, Users, BarChart2, LogOut, UserCircle,
} from 'lucide-react';
import { cn, getInitials } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import AppLogo from '@/components/ui/AppLogo';

const developerNav = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { href: '/time-logs', icon: Clock, label: 'Time Logs' },
  { href: '/clients', icon: Users, label: 'Clients' },
  { href: '/reports', icon: BarChart2, label: 'Reports' },
  { href: '/profile', icon: UserCircle, label: 'Profile' },
];

const clientNav = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/tasks', icon: CheckSquare, label: 'My Tasks' },
  { href: '/reports', icon: BarChart2, label: 'Reports' },
  { href: '/profile', icon: UserCircle, label: 'My Profile' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const navItems = user?.role === 'developer' ? developerNav : clientNav;

  return (
    <aside className="hidden lg:flex flex-col w-64 h-screen fixed left-0 top-0 border-r border-white/[0.06] z-40"
      style={{ background: 'linear-gradient(180deg, #080b1e 0%, #06081a 100%)' }}>
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/[0.06]">
        <AppLogo
          size="sm"
          subtitle={user?.role === 'developer' ? 'Developer Portal' : 'Client Portal'}
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                isActive
                  ? 'text-white nav-item-active'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
              )}
            >
              <Icon className={cn('w-4 h-4 flex-shrink-0', isActive ? 'text-violet-400' : '')} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User Info */}
      <div className="px-3 pb-4 border-t border-white/[0.05] pt-3">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05]">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(79,70,229,0.2))', border: '1px solid rgba(124,58,237,0.3)' }}
          >
            <span className="text-xs font-semibold text-violet-300">
              {user ? getInitials(user.name) : '??'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
            <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
          </div>
          <button
            onClick={logout}
            className="p-1.5 text-slate-500 hover:text-red-400 transition-colors rounded-lg hover:bg-red-400/10"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
