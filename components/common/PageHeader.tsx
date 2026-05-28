import React from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string; // description in your pages → use subtitle
  action?: React.ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
  className?: string; // added safely
}

export default function PageHeader({
  title,
  subtitle,
  action,
  breadcrumbs,
  className = "",
}: PageHeaderProps) {
  return (
    <div className={className}>
      {/* Breadcrumbs */}
      {breadcrumbs && (
        <div className="mb-6 flex items-center gap-2 text-sm text-gray-600">
          {breadcrumbs.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2">
              {item.href ? (
                <a href={item.href} className="hover:text-blue-600">
                  {item.label}
                </a>
              ) : (
                <span className="text-gray-900 font-medium">{item.label}</span>
              )}
              {idx < breadcrumbs.length - 1 && (
                <span className="text-gray-400">/</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Title + Action */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">{title}</h1>

          {subtitle && (
            <p className="text-gray-600 mt-2 text-sm">{subtitle}</p>
          )}
        </div>

        {action && <div>{action}</div>}
      </div>
    </div>
  );
}
