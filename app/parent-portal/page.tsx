"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatPersonName, formatStudentName } from "@/lib/formatName";
import { useAuth } from "@/context/AuthContext";

export default function ParentPortalHome() {
  const { user } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [parentName, setParentName] = useState("Parent");

  useEffect(() => {
    fetch("/api/auth/profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.user) {
          setParentName(formatPersonName(data.user, "Parent"));
        } else {
          setParentName(formatPersonName(user, "Parent"));
        }
      })
      .catch(() => setParentName(formatPersonName(user, "Parent")));
  }, [user]);

  useEffect(() => {
    fetch("/api/parent/students")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setStudents(d.students || []);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-4">Loading...</div>;

  return (
    <div className="p-4 space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">My Children</h1>
        <p className="text-sm text-gray-500 mt-1">Logged in as {parentName}</p>
      </div>

      {students.length === 0 ? (
        <div>No linked children found.</div>
      ) : (
        <div className="grid gap-4">
          {students.map((s: any) => (
            <Link key={s._id} href={`/parent-portal/students/${s._id}`}>
              <div className="border p-4 rounded shadow hover:bg-gray-50 cursor-pointer">
                <h2 className="text-lg font-semibold">{formatStudentName(s)}</h2>
                <p>Admission No: {s.admissionNo || s.admission_no || "-"}</p>
                {s.parents?.[0]?.name && (
                  <p className="text-sm text-gray-600 mt-1">Parent: {s.parents[0].name}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
