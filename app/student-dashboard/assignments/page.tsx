"use client";
import { useState } from "react";
import Card from "@/components/common/Card";
import Table from "@/components/common/Table";
import PageHeader from "@/components/common/PageHeader";

export default function StudentAssignmentsPage() {
  const [assignments] = useState([
    { id: 1, title: "Math Problem Set", subject: "Mathematics", dueDate: "2025-12-15", status: "pending", marks: null },
    { id: 2, title: "Essay on History", subject: "Social Studies", dueDate: "2025-12-18", status: "submitted", marks: null },
    { id: 3, title: "Science Project", subject: "Science", dueDate: "2025-12-10", status: "submitted", marks: 45 },
  ]);

  return (
    <div className="p-6">
      <PageHeader title="My Assignments" />

      <Card className="p-6" shadow="md">
       <Table
  columns={[
    {
      key: "title",
      label: "Assignment",
      render: (v) => v as React.ReactNode,   // ✅ FIX
    },
    {
      key: "subject",
      label: "Subject",
      render: (v) => v as React.ReactNode,   // ✅ FIX
    },
    {
      key: "dueDate",
      label: "Due Date",
      render: (v) => v as React.ReactNode,   // ✅ FIX
    },
    {
      key: "status",
      label: "Status",
      render: (v) => (
        <span
          className={`px-3 py-1 rounded text-sm font-medium ${
            v === "submitted"
              ? "bg-green-100 text-green-800"
              : "bg-yellow-100 text-yellow-800"
          }`}
        >
          {v as string}
        </span>
      ),
    },
    {
      key: "marks",
      label: "Marks",
      render: (v) => (v ? `${v}/50` : "—") as React.ReactNode,  // ✅ FIX
    },
  ]}
  data={assignments}
  striped
  hoverable
/>

      </Card>
    </div>
  );
}
