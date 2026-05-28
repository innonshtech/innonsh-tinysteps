import React, { SelectHTMLAttributes } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options?: { value: string | number; label: string }[];
  fullWidth?: boolean;
}

export default function Select({
  label,
  error,
  helperText,
  options = [],
  fullWidth = false,
  className = "",
  children,
  ...props
}: SelectProps) {
  return (
    <div className={`${fullWidth ? "w-full" : ""}`}>
      {label && <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>}
      <select
        {...props}
        className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
          error ? "border-red-500 focus:ring-red-500" : ""
        } ${className}`}
      >
        <option value="">Select an option</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
        {children}
      </select>
      {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
      {helperText && <p className="text-gray-500 text-sm mt-1">{helperText}</p>}
    </div>
  );
}
