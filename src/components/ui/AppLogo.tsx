'use client';

interface AppLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  subtitle?: string;
}

const sizes = {
  sm: { container: 'w-8 h-8 rounded-xl', icon: 24, textSize: 'text-base', subSize: 'text-[9px]' },
  md: { container: 'w-10 h-10 rounded-xl', icon: 28, textSize: 'text-lg', subSize: 'text-[10px]' },
  lg: { container: 'w-14 h-14 rounded-2xl', icon: 36, textSize: 'text-2xl', subSize: 'text-xs' },
};

export default function AppLogo({ size = 'md', showText = true, subtitle }: AppLogoProps) {
  const s = sizes[size];
  return (
    <div className="flex items-center gap-3">
      <div
        className={`${s.container} flex items-center justify-center flex-shrink-0`}
        style={{
          background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
          boxShadow: '0 4px 20px rgba(124, 58, 237, 0.4)',
        }}
      >
        <LogoIcon size={s.icon} />
      </div>
      {showText && (
        <div>
          <div className={`${s.textSize} font-bold leading-none`} style={{
            background: 'linear-gradient(135deg, #c4b5fd 0%, #a5b4fc 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            TrackForge
          </div>
          {subtitle && (
            <p className={`${s.subSize} text-slate-500 mt-0.5 uppercase tracking-wider`}>{subtitle}</p>
          )}
        </div>
      )}
    </div>
  );
}

function LogoIcon({ size }: { size: number }) {
  const s = size;
  const cx = s / 2;
  const r = s * 0.28;
  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx={cx} cy={cx} r={r} stroke="rgba(255,255,255,0.3)" strokeWidth={s * 0.04} />
      <line x1={cx} y1={cx} x2={cx - r * 0.55} y2={cx - r * 0.75} stroke="white" strokeWidth={s * 0.075} strokeLinecap="round" />
      <line x1={cx} y1={cx} x2={cx + r * 0.7} y2={cx} stroke="white" strokeWidth={s * 0.06} strokeLinecap="round" />
      <circle cx={cx} cy={cx} r={s * 0.07} fill="white" />
    </svg>
  );
}
