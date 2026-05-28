import React, { ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
  variant?: "primary" | "success" | "danger" | "warning" | "info" | "gray";
  size?: "sm" | "md" | "lg";
  rounded?: boolean;
}

export default function Badge({
  children,
  variant = "primary",
  size = "md",
  rounded = false,
}: BadgeProps) {
  const variants = {
    primary: "bg-blue-100 text-blue-700",
    success: "bg-green-100 text-green-700",
    danger: "bg-red-100 text-red-700",
    warning: "bg-amber-100 text-amber-700",
    info: "bg-cyan-100 text-cyan-700",
    gray: "bg-gray-100 text-gray-700",
  };

  const sizes = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-1 text-sm",
    lg: "px-4 py-2 text-base",
  };

  return (
    <span
      className={`inline-block font-medium ${variants[variant]} ${sizes[size]} ${
        rounded ? "rounded-full" : "rounded"
      }`}
    >
      {children}
    </span>
  );
}
