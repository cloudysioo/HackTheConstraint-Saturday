import * as React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'verified' | 'flagged' | 'pending' | 'conflict' | 'info' | 'outline' | 'default';
}

export const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const baseClasses =
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors border';

    const variantClasses = {
      default: 'bg-neutral-100 text-neutral-800 border-neutral-200',
      verified: 'bg-[#e8f5e9] text-[#2E7D32] border-[#a5d6a7]', // Medical Green
      flagged: 'bg-[#fff1f2] text-[#FF5A5F] border-[#fca5a5]',  // Coral
      pending: 'bg-neutral-100 text-neutral-600 border-neutral-300', // Gray/Neutral
      conflict: 'bg-[#fdf2f2] text-[#922B2B] border-[#f87171] font-bold', // Dark Red/Burgundy
      info: 'bg-[#e6f9fa] text-[#1F4E5B] border-[#2BC4C6]/40',   // Teal
      outline: 'text-neutral-700 border-neutral-300 bg-white',
    };

    return (
      <div
        ref={ref}
        className={cn(baseClasses, variantClasses[variant], className)}
        {...props}
      />
    );
  }
);
Badge.displayName = 'Badge';
