import React from "react";

interface RadioOption<T extends string = string> {
  value: T;
  label: string;
}

interface RadioGroupProps<T extends string = string> {
  name: string;
  options: RadioOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export function RadioGroup<T extends string = string>({
  name,
  options,
  value,
  onChange,
  className = "",
}: RadioGroupProps<T>) {
  return (
    <div className={`flex flex-wrap gap-3 ${className}`}>
      {options.map((opt) => (
        <label
          key={opt.value}
          className="flex items-center gap-2 cursor-pointer rounded-full focus-within:outline-none"
        >
          <input
            type="radio"
            name={name}
            value={opt.value}
            checked={value === opt.value}
            onChange={() => onChange(opt.value as T)}
            className="w-4 h-4 border-1 border-slate-300 rounded-full cursor-pointer transition-colors focus:outline-none focus:ring-0 focus:ring-offset-0"
          />
          <span className="text-sm font-medium text-slate-700">
            {opt.label}
          </span>
        </label>
      ))}
    </div>
  );
}

export default RadioGroup;
