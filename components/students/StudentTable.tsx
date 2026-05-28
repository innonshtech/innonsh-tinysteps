"use client";
import React from "react";
import StudentCard from "./StudentCard";

export default function StudentTable({ students }: { students: any[] }) {
  if (!students?.length) return <div>No students yet.</div>;
  return (
    <div className="grid gap-4">
      {students.map((s) => (
        <StudentCard key={s._id} student={s} />
      ))}
    </div>
  );
}
