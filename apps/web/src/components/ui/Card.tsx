import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
}

export function Card({
  children,
  className = '',
  padding = 'md',
  hover = false
}: CardProps) {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const hoverClass = hover ? 'hover:shadow-soft-lg transition-shadow duration-300' : '';

  return (
    <div className={`bg-white rounded-2xl shadow-soft ${paddingClasses[padding]} ${hoverClass} ${className}`}>
      {children}
    </div>
  );
}
