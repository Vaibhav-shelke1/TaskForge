'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, CheckSquare, Clock, Users, BarChart2, UserCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';

const developerNav = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { href: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { href: '/time-logs', icon: Clock, label: 'Logs' },
  { href: '/clients', icon: Users, label: 'Clients' },
  { href: '/profile', icon: UserCircle, label: 'Profile' },
];

const clientNav = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { href: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { href: '/reports', icon: BarChart2, label: 'Reports' },
  { href: '/profile', icon: UserCircle, label: 'Profile' },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuthStore();

  const navItems = user?.role === 'developer' ? developerNav : clientNav;

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-white/[0.06]"
      style={{ background: 'rgba(6,8,26,0.95)', backdropFilter: 'blur(12px)' }}>
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all duration-200 min-w-[52px]',
                isActive ? 'text-violet-400' : 'text-slate-500 hover:text-slate-300'
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
