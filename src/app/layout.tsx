import type { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'TrackForge', template: '%s | TrackForge' },
  description: 'Professional task and time tracking for developers and clients',
  keywords: ['time tracking', 'task management', 'project management'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1a2244',
              color: '#f1f5f9',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              fontSize: '14px',
              fontFamily: 'Poppins, sans-serif',
            },
            success: { iconTheme: { primary: '#10b981', secondary: '#080c1a' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#080c1a' } },
          }}
        />
      </body>
    </html>
  );
}
