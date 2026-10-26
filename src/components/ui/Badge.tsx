import React from 'react';
import { cn } from '../../lib/utils';
import { ApplicationStatus } from '../../types';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'ai';
  status?: ApplicationStatus;
  className?: string;
  children?: React.ReactNode;
}

export function Badge({ className, variant = 'default', status, children, ...props }: BadgeProps) {
  let appliedVariant = variant;
  
  if (status) {
    switch (status) {
      case 'Applied': appliedVariant = 'info'; break;
      case 'Under Review': appliedVariant = 'warning'; break;
      case 'Shortlisted': appliedVariant = 'ai'; break;
      case 'Assessment': appliedVariant = 'default'; break; // Indigo maybe? We can handle it in switch
      case 'Interview': appliedVariant = 'info'; break; // Cyanish
      case 'Offer': appliedVariant = 'success'; break;
      case 'Rejected': appliedVariant = 'danger'; break;
      default: appliedVariant = 'default';
    }
  }

  const baseStyles = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors";
  
  // Specific status color overrides based on prompt
  const statusStyles: Record<string, string> = {
    'Applied': 'bg-indigo-100 text-indigo-700',
    'Under Review': 'bg-orange-100 text-orange-700',
    'Shortlisted': 'bg-purple-100 text-purple-700',
    'Assessment': 'bg-blue-100 text-blue-700',
    'Interview': 'bg-cyan-100 text-cyan-700',
    'Offer': 'bg-emerald-100 text-emerald-700',
    'Rejected': 'bg-red-100 text-red-700',
    'Saved': 'bg-slate-100 text-slate-700',
  };

  const variants = {
    default: "bg-slate-100 text-slate-700",
    success: "bg-emerald-100 text-emerald-700",
    warning: "bg-orange-100 text-orange-700",
    danger: "bg-red-100 text-red-700",
    info: "bg-indigo-100 text-indigo-700",
    ai: "bg-purple-100 text-purple-700",
  };

  const finalStyle = status && statusStyles[status] ? statusStyles[status] : variants[appliedVariant];

  return (
    <div className={cn(baseStyles, finalStyle, className)} {...props}>
      {children}
    </div>
  );
}
