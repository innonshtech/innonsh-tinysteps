"use client";
import { useState } from "react";
import Card from "@/components/common/Card";
import Table from "@/components/common/Table";
import Button from "@/components/common/Button";
import PageHeader from "@/components/common/PageHeader";
import Input from "@/components/common/Input";

export default function TeacherAssignmentsPage() {
  const [assignments, setAssignments] = useState([
    { id: 1, title: "Math Problem Set", subject: "Mathematics", dueDate: "2025-12-15", submitted: 15, total: 25 },
    { id: 2, title: "Essay on History", subject: "Social Studies", dueDate: "2025-12-18", submitted: 12, total: 25 },
  ]);

  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [dueDate, setDueDate] = useState("");

  const handleAddAssignment = () => {
    if (!title || !subject || !dueDate) {
      alert("Please fill in all fields");
      return;
    }

    const newAssignment = {
      id: Date.now(),
      title,
      subject,
      dueDate,
      submitted: 0,
      total: 25,
    };

    setAssignments([...assignments, newAssignment]);
    setTitle("");
    setSubject("");
    setDueDate("");
  };

  return (
    <div className="p-6">
     <PageHeader
  title="Assignments"
  subtitle="Create and manage student assignments"
/>


      <Card className="p-6 mb-6">
        <h2 className="text-lg font-bold mb-4">Create New Assignment</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Assignment Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Math Problem Set"
          />

          <Input
            label="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g., Mathematics"
          />

          <Input
            label="Due Date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>

        <Button variant="primary" onClick={handleAddAssignment} className="mt-4">
          Create Assignment
        </Button>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-bold mb-4">Your Assignments</h2>

        <Table
          columns={[
            { key: "title", label: "Title", render: (v) => v as React.ReactNode },
            { key: "subject", label: "Subject", render: (v) => v as React.ReactNode },
            { key: "dueDate", label: "Due Date", render: (v) => v as React.ReactNode },
            {
              key: "submitted",
              label: "Submissions",
              render: (v, row) => `${row.submitted}/${row.total}`,
            },
            {
              key: "actions",
              label: "Actions",
              render: () => (
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm">View</Button>
                  <Button variant="danger" size="sm">Delete</Button>
                </div>
              ),
            },
          ]}
          data={assignments}
          striped
        />
      </Card>
    </div>
  );
}
