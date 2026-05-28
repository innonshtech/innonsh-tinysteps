// app/parent-portal/admission/status/page.tsx
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function ParentAdmissionStatus() {
  const [apps, setApps] = useState<any[]>([]);

  useEffect(()=> {
    fetch("/api/parent/admissions") // we'll create this convenience route below
      .then(r=>r.json())
      .then(d=> { if (d.success) setApps(d.admissions || []) });
  },[]);

  return (
    <div className="p-4">
      <h1 className="text-2xl">My Applications</h1>
      <div className="grid gap-3 mt-4">
        {apps.map(a=>(
          <Link key={a._id} href={`/parent-portal/students/${a.convertedStudentId || ""}`}>
            <div className="border p-3 rounded">
              <div><strong>{a.childFirstName} {a.childLastName}</strong></div>
              <div>Status: {a.status}</div>
              <div>Applied: {new Date(a.createdAt).toLocaleDateString()}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
