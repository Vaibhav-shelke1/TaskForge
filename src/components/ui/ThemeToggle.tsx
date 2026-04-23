'use client';

import { Sun, Moon } from 'lucide-react';
import { useThemeStore } from '@/store/themeStore';

interface ThemeToggleProps {
  className?: string;
}

export default function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const { theme, toggleTheme } = useThemeStore();
  const isLight = theme === 'light';

  return (
    <button
      onClick={toggleTheme}
      title={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
      className={`p-2 rounded-xl transition-all duration-200 ${
        isLight
          ? 'text-amber-500 hover:bg-amber-50 hover:text-amber-600'
          : 'text-slate-400 hover:text-amber-400 hover:bg-white/[0.06]'
      } ${className}`}
    >
      {isLight ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
}
