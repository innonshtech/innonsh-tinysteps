import React from "react";

interface StatsCardProps {
  icon: string;
  title: string;
  value: string | number;
  description?: string;
  color?: "blue" | "green" | "red" | "purple" | "orange" | "cyan";
  onClick?: () => void;
}

export default function StatsCard({
  icon,
  title,
  value,
  description,
  color = "blue",
  onClick,
}: StatsCardProps) {
  const colorClasses = {
    blue: "bg-blue-50 border-l-4 border-blue-500",
    green: "bg-green-50 border-l-4 border-green-500",
    red: "bg-red-50 border-l-4 border-red-500",
    purple: "bg-purple-50 border-l-4 border-purple-500",
    orange: "bg-orange-50 border-l-4 border-orange-500",
    cyan: "bg-cyan-50 border-l-4 border-cyan-500",
  };

  const iconColors = {
    blue: "text-blue-600",
    green: "text-green-600",
    red: "text-red-600",
    purple: "text-purple-600",
    orange: "text-orange-600",
    cyan: "text-cyan-600",
  };

  return (
    <div
      onClick={onClick}
      className={`p-6 rounded-lg ${colorClasses[color]} ${onClick ? "cursor-pointer hover:shadow-md transition-shadow" : ""
        }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className={`text-3xl font-bold mt-2 ${iconColors[color]}`}>{value}</p>
          {description && <p className="text-gray-500 text-sm mt-1">{description}</p>}
        </div>
        <div className={`text-5xl ${iconColors[color]}`}>{icon}</div>
      </div>
    </div>
  );
}
