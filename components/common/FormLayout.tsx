import React from "react";

interface FormLayoutProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3;
  gap?: "sm" | "md" | "lg";
  onSubmit?: (e: React.FormEvent) => void;
}

export default function FormLayout({
  children,
  columns = 2,
  gap = "md",
  onSubmit,
}: FormLayoutProps) {
  const columnClasses = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
  };

  const gapClasses = {
    sm: "gap-3",
    md: "gap-4",
    lg: "gap-6",
  };

  return (
    <form onSubmit={onSubmit}>
      <div className={`grid ${columnClasses[columns]} ${gapClasses[gap]}`}>
        {children}
      </div>
    </form>
  );
}
