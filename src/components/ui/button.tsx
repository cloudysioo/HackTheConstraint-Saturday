import * as React from 'react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'outline' | 'ghost' | 'warning' | 'link';
  size?: 'sm' | 'default' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'default', ...props }, ref) => {
    const baseClasses =
      'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none text-sm';

    const variantClasses = {
      default: 'bg-primary text-white hover:bg-primary-hover focus-visible:ring-primary',
      primary: 'bg-primary text-white hover:bg-primary-hover focus-visible:ring-primary shadow-sm',
      secondary: 'bg-secondary text-primary font-semibold hover:bg-secondary-hover focus-visible:ring-secondary',
      outline:
        'border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-700 hover:text-neutral-900 focus-visible:ring-primary',
      ghost: 'hover:bg-neutral-100 text-neutral-700 hover:text-neutral-900',
      warning:
        'bg-warning/10 text-warning hover:bg-warning/20 border border-warning/30 focus-visible:ring-warning',
      link: 'text-primary underline-offset-4 hover:underline p-0 h-auto',
    };

    const sizeClasses = {
      sm: 'h-8 px-3 text-xs',
      default: 'h-10 px-4 py-2',
      lg: 'h-12 px-6 text-base font-semibold',
      icon: 'h-10 w-10',
    };

    return (
      <button
        ref={ref}
        className={cn(baseClasses, variantClasses[variant], sizeClasses[size], className)}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
