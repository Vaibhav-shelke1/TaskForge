'use client';

import { cn } from '@/lib/utils';
import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  hint?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, hint, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium mb-1.5" style={{ color: 'var(--th-text-2)' }}>
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full rounded-xl px-4 py-2.5 text-sm placeholder-slate-500 transition-all duration-200',
              'focus:outline-none focus:ring-1',
              error
                ? 'border border-red-500/50 focus:border-red-500 focus:ring-red-500/20'
                : 'border focus:border-violet-600 focus:ring-violet-600/20',
              icon && 'pl-10',
              className
            )}
            style={{
              backgroundColor: 'var(--th-input-bg)',
              borderColor: error ? undefined : 'var(--th-input-border)',
              color: 'var(--th-input-text)',
            }}
            {...props}
          />
        </div>
        {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
        {hint && !error && <p className="mt-1.5 text-xs text-slate-500">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
