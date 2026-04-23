'use client';

import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';
import { SelectHTMLAttributes, forwardRef } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, placeholder, id, ...props }, ref) => {
    const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={selectId} className="block text-sm font-medium mb-1.5" style={{ color: 'var(--th-text-2)' }}>
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              'w-full rounded-xl px-4 py-2.5 text-sm appearance-none cursor-pointer transition-all duration-200 pr-10',
              'focus:outline-none focus:ring-1',
              error
                ? 'border border-red-500/50 focus:border-red-500 focus:ring-red-500/20'
                : 'border focus:border-violet-600 focus:ring-violet-600/20',
              className
            )}
            style={{
              backgroundColor: 'var(--th-input-bg)',
              borderColor: error ? undefined : 'var(--th-input-border)',
              color: 'var(--th-input-text)',
            }}
            {...props}
          >
            {placeholder && (
              <option value="" style={{ background: 'var(--th-select-opt)', color: 'var(--th-text-3)' }}>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} style={{ background: 'var(--th-select-opt)', color: 'var(--th-input-text)' }}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
        </div>
        {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
export default Select;
