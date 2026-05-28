"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function ParentPortalHome() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/parent/students")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setStudents(d.students);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold">My Children</h1>

      {students.length === 0 ? (
        <div>No linked children found.</div>
      ) : (
        <div className="grid gap-4">
          {students.map((s: any) => (
            <Link key={s._id} href={`/parent-portal/students/${s._id}`}>
              <div className="border p-4 rounded shadow hover:bg-gray-50 cursor-pointer">
                <h2 className="text-lg font-semibold">
                  {s.firstName} {s.lastName}
                </h2>
                <p>Admission No: {s.admissionNo}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
