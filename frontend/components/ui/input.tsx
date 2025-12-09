import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <label className="flex flex-col gap-1 text-sm text-gray-700">
        {label && <span className="font-medium text-gray-900">{label}</span>}
        <input
          ref={ref}
          className={cn(
            'rounded-md border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-primary focus:ring-2 focus:ring-blue-100 focus:outline-none',
            error && 'border-red-400 focus:border-red-400 focus:ring-red-100',
            className
          )}
          {...props}
        />
        {error && <span className="text-xs text-red-500">{error}</span>}
      </label>
    );
  }
);

Input.displayName = 'Input';
