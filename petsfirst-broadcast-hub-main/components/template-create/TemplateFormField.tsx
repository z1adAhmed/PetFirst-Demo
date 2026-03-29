import React from 'react';

interface TemplateFormFieldProps {
  label: string;
  required?: boolean;
  optional?: boolean;
  hint?: string;
  charCount?: { current: number; max: number };
  error?: string;
  children: React.ReactNode;
  className?: string;
}

export const TemplateFormField: React.FC<TemplateFormFieldProps> = ({
  label,
  required,
  optional,
  hint,
  charCount,
  error,
  children,
  className = '',
}) => (
  <div className={`space-y-1.5 ${className}`}>
    <div className="flex items-center justify-between gap-2">
      <label className="text-sm font-bold text-slate-700">
        {label}
        {required && <span className="text-rose-500 ml-0.5">*</span>}
        {optional && (
          <span className="ml-1.5 text-xs font-medium text-slate-400 normal-case">Optional</span>
        )}
      </label>
      {charCount != null && (
        <span className="text-xs text-slate-400 tabular-nums">
          {charCount.current}/{charCount.max}
        </span>
      )}
    </div>
    {hint && (
      <p className="text-xs text-slate-500">{hint}</p>
    )}
    {children}
    {error && (
      <p className="text-xs text-rose-600 font-medium" role="alert">{error}</p>
    )}
  </div>
);
