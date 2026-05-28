"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function ParentAttendance({ params }: any) {
  const { studentId } = params;
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/parent/attendance/${studentId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setAttendance(d.attendance);
      })
      .finally(() => setLoading(false));
  }, [studentId]);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-4">
      <Link href={`/parent-portal/students/${studentId}`}>
        <button className="border px-4 py-1 rounded">← Back</button>
      </Link>

      <h1 className="text-xl font-bold my-4">Attendance</h1>

      <div className="space-y-3">
        {attendance.map((a: any) => (
          <div key={a._id} className="border p-3 rounded shadow-sm">
            <p><strong>Date:</strong> {new Date(a.date).toLocaleDateString()}</p>
            <p><strong>Status:</strong> {a.status}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
