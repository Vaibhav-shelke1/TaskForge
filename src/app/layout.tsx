import type { Metadata } from 'next';
import ThemeProvider from '@/components/layout/ThemeProvider';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'TrackForge', template: '%s | TrackForge' },
  description: 'Professional task and time tracking for developers and their clients',
  keywords: ['time tracking', 'task management', 'project management', 'client portal'],
  icons: { icon: '/icon.svg' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Apply saved theme before first paint to prevent flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem('trackforge-theme');var t=s?JSON.parse(s).state?.theme:'dark';document.documentElement.classList.add(t||'dark')}catch(e){document.documentElement.classList.add('dark')}})()`,
          }}
        />
      </head>
      <body className="antialiased">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
