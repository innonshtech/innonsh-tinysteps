"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function ParentChildDetails({ params }: any) {
  const { id } = params;
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/parent/students/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setStudent(d.student);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div>Loading...</div>;
  if (!student) return <div>Student not found.</div>;

  return (
    <div className="p-4 space-y-4">
      <Link href="/parent-portal">
        <button className="px-4 py-1 border rounded">← Back</button>
      </Link>

      <h1 className="text-2xl font-bold">
        {student.firstName} {student.lastName}
      </h1>

      <div className="border p-4 rounded">
        <p><strong>Admission No:</strong> {student.admissionNo}</p>
        <p><strong>DOB:</strong> {student.dob ? new Date(student.dob).toLocaleDateString() : "-"}</p>
        <p><strong>Class:</strong> {student.classId || "-"}</p>
      </div>

      {/* Links to child-specific data */}
      <div className="grid gap-3">
        <Link href={`/parent-portal/attendance/${student._id}`}>
          <div className="parent-tile">📅 View Attendance</div>
        </Link>

        <Link href={`/parent-portal/fees/${student._id}`}>
          <div className="parent-tile">💰 View Fees</div>
        </Link>

        <Link href={`/parent-portal/assessments/${student._id}`}>
          <div className="parent-tile">📘 View Assessments</div>
        </Link>

        <Link href={`/parent-portal/timetable/${student.classId}`}>
          <div className="parent-tile">📚 View Timetable</div>
        </Link>

        <Link href="/parent-portal/notifications">
          <div className="parent-tile">🔔 Notifications</div>
        </Link>
      </div>

      <style>{`
        .parent-tile {
          border: 1px solid #ddd;
          padding: 12px;
          border-radius: 8px;
          cursor: pointer;
          background: #fafafa;
          font-weight: 500;
          transition: 0.2s;
        }
        .parent-tile:hover {
          background: #eef2ff;
        }
      `}</style>
    </div>
  );
}
