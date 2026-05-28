import React, { ReactNode } from "react";

interface AlertProps {
  children: ReactNode;
  variant?: "success" | "error" | "warning" | "info";
  icon?: ReactNode;
  closable?: boolean;
  onClose?: () => void;
}

export default function Alert({
  children,
  variant = "info",
  icon,
  closable = false,
  onClose,
}: AlertProps) {
  const variants = {
    success: "bg-green-50 border-green-200 text-green-800",
    error: "bg-red-50 border-red-200 text-red-800",
    warning: "bg-amber-50 border-amber-200 text-amber-800",
    info: "bg-blue-50 border-blue-200 text-blue-800",
  };

  const icons = {
    success: "✓",
    error: "✕",
    warning: "⚠",
    info: "ℹ",
  };

  return (
    <div className={`border rounded-lg p-4 flex items-start gap-3 ${variants[variant]}`}>
      <span className="text-lg font-bold shrink-0">
        {icon || icons[variant]}
      </span>
      <div className="flex-1">{children}</div>
      {closable && (
        <button onClick={onClose} className="text-lg font-bold shrink-0 hover:opacity-70">
          ×
        </button>
      )}
    </div>
  );
}
