import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' };
const borders = { sm: 'border-2', md: 'border-2', lg: 'border-[3px]' };

export default function LoadingSpinner({ size = 'md', className, label }: LoadingSpinnerProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <div
        className={cn(
          'rounded-full animate-spin border-transparent',
          sizes[size],
          borders[size]
        )}
        style={{
          borderTopColor: '#7c3aed',
          borderRightColor: 'rgba(124,58,237,0.3)',
          borderBottomColor: 'rgba(124,58,237,0.1)',
          borderLeftColor: 'rgba(124,58,237,0.2)',
        }}
      />
      {label && <p className="text-sm text-slate-400">{label}</p>}
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <LoadingSpinner size="lg" label="Loading..." />
    </div>
  );
}

export function AppLoader() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-8"
      style={{
        background: '#06081a',
        backgroundImage: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(124,58,237,0.1) 0%, transparent 60%)',
      }}
    >
      {/* Animated Logo */}
      <div className="flex flex-col items-center gap-5">
        <div className="relative">
          {/* Outer spinning ring */}
          <div
            className="w-20 h-20 rounded-full animate-spin"
            style={{
              border: '2px solid transparent',
              borderTopColor: '#7c3aed',
              borderRightColor: 'rgba(124,58,237,0.4)',
              borderBottomColor: 'rgba(124,58,237,0.1)',
              borderLeftColor: 'rgba(124,58,237,0.2)',
              animationDuration: '1.2s',
            }}
          />
          {/* Inner logo box */}
          <div
            className="absolute inset-0 m-3 rounded-2xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
              boxShadow: '0 4px 24px rgba(124,58,237,0.5)',
            }}
          >
            <ClockIcon />
          </div>
        </div>

        <div className="text-center">
          <div
            className="text-2xl font-bold"
            style={{
              fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
              background: 'linear-gradient(135deg, #c4b5fd 0%, #a5b4fc 50%, #93c5fd 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            TrackForge
          </div>
          <p className="text-slate-500 text-xs mt-1 uppercase tracking-widest">Forge Your Workflow</p>
        </div>
      </div>

      {/* Progress dots */}
      <div className="flex gap-1.5">
        <div className="w-1.5 h-1.5 rounded-full bg-violet-600 animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-1.5 h-1.5 rounded-full bg-violet-600 animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-1.5 h-1.5 rounded-full bg-violet-600 animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );
}

function ClockIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <circle cx="14" cy="14" r="8" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
      <line x1="14" y1="14" x2="10" y2="9.5" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <line x1="14" y1="14" x2="18.5" y2="14" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="14" cy="14" r="1.5" fill="white" />
    </svg>
  );
}
