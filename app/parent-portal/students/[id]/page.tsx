"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatStudentName } from "@/lib/formatName";

export default function ParentChildDetails({ params }: { params: { id: string } }) {
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

  const classLabel = student.className || student.class?.name;
  const sectionLabel = student.section || student.class?.section;
  const classDisplay =
    classLabel && sectionLabel ? `${classLabel} - ${sectionLabel}` : classLabel || sectionLabel || "-";

  return (
    <div className="p-4 space-y-4">
      <Link href="/parent-portal">
        <button type="button" className="px-4 py-1 border rounded">← Back</button>
      </Link>

      <h1 className="text-2xl font-bold">{formatStudentName(student)}</h1>

      <div className="border p-4 rounded">
        <p><strong>Admission No:</strong> {student.admissionNo || student.admission_no || "-"}</p>
        <p><strong>DOB:</strong> {student.dob ? new Date(student.dob).toLocaleDateString() : "-"}</p>
        <p><strong>Class:</strong> {classDisplay}</p>
        {student.parents?.[0]?.name && (
          <p><strong>Parent:</strong> {student.parents[0].name}</p>
        )}
      </div>

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

        {student.classId && (
          <Link href={`/parent-portal/timetable/${student.classId}`}>
            <div className="parent-tile">📚 View Timetable</div>
          </Link>
        )}

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
