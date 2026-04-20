import type { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'TrackForge', template: '%s | TrackForge' },
  description: 'Professional task and time tracking for developers and their clients',
  keywords: ['time tracking', 'task management', 'project management', 'client portal'],
  icons: { icon: '/icon.svg' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#13162a',
              color: '#f1f5f9',
              border: '1px solid rgba(124,58,237,0.2)',
              borderRadius: '12px',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#10b981', secondary: '#06081a' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#06081a' } },
          }}
        />
      </body>
    </html>
  );
}
