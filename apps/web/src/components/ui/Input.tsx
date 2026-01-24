import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, icon, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-coffee-700 mb-2">
            {label}
          </label>
        )}

        <div className="relative">
          {icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-coffee-400">
              {icon}
            </div>
          )}

          <input
            ref={ref}
            className={`
              w-full px-4 py-3 rounded-xl border-2
              ${icon ? 'pl-12' : ''}
              ${error
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                : 'border-sand-200 focus:border-cream-500 focus:ring-cream-500/20'
              }
              bg-white
              text-coffee-800 placeholder-coffee-400
              transition-all duration-200
              focus:outline-none focus:ring-4
              disabled:bg-sand-50 disabled:cursor-not-allowed
              ${className}
            `}
            {...props}
          />
        </div>

        {error && (
          <p className="mt-2 text-sm text-red-600">{error}</p>
        )}

        {helperText && !error && (
          <p className="mt-2 text-sm text-coffee-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
