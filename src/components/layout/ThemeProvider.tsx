'use client';

import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { useThemeStore } from '@/store/themeStore';

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useThemeStore();

  useEffect(() => {
    const html = document.documentElement;
    html.classList.remove('dark', 'light');
    html.classList.add(theme);
  }, [theme]);

  const isLight = theme === 'light';

  return (
    <>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: isLight ? '#ffffff' : '#13162a',
            color: isLight ? '#0f172a' : '#f1f5f9',
            border: isLight ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(124,58,237,0.2)',
            borderRadius: '12px',
            fontSize: '14px',
            boxShadow: isLight ? '0 4px 20px rgba(0,0,0,0.08)' : '0 4px 20px rgba(0,0,0,0.4)',
          },
          success: {
            iconTheme: { primary: '#10b981', secondary: isLight ? '#f0fdf4' : '#06081a' },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: isLight ? '#fef2f2' : '#06081a' },
          },
        }}
      />
    </>
  );
}
