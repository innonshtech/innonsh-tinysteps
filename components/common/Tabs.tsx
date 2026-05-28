import React from "react";

interface TabsProps {
  tabs: { label: string; content: React.ReactNode; active?: boolean }[];
  onChange?: (index: number) => void;
}

export default function Tabs({ tabs, onChange }: TabsProps) {
  const [activeTab, setActiveTab] = React.useState(tabs.findIndex((t) => t.active) || 0);

  const handleTabChange = (index: number) => {
    setActiveTab(index);
    onChange?.(index);
  };

  return (
    <div>
      <div className="border-b border-gray-200 flex gap-1">
        {tabs.map((tab, idx) => (
          <button
            key={idx}
            onClick={() => handleTabChange(idx)}
            className={`px-4 py-3 font-medium text-sm border-b-2 transition-all ${
              activeTab === idx
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="mt-4">{tabs[activeTab]?.content || ""}</div>
    </div>
  );
}
