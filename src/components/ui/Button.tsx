'use client';

import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

const sizes = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-6 py-3 text-base gap-2',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, icon, children, disabled, style, ...props }, ref) => {
    const isPrimary = variant === 'primary';

    const variantClass = {
      primary: 'text-white border-transparent',
      ghost: 'bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white border-white/[0.08]',
      danger: 'bg-red-600/15 hover:bg-red-600/25 text-red-400 hover:text-red-300 border-red-500/20',
      outline: 'bg-transparent hover:bg-white/[0.04] text-slate-300 hover:text-white border-white/20',
    }[variant];

    const primaryStyle = isPrimary
      ? {
          background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
          boxShadow: '0 2px 10px rgba(124,58,237,0.3)',
          ...style,
        }
      : style;

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center font-medium rounded-xl border',
          'transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed',
          isPrimary && 'hover:opacity-90',
          variantClass,
          sizes[size],
          className
        )}
        style={primaryStyle}
        {...props}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          icon && <span className="flex-shrink-0">{icon}</span>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;
