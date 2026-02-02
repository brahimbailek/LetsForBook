import React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-coffee-700 mb-2">
            {label}
          </label>
        )}

        <textarea
          ref={ref}
          className={`
            w-full px-4 py-3 rounded-xl border-2 resize-none
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

Textarea.displayName = 'Textarea';
