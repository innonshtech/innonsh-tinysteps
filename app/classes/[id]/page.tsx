"use client";
import { useEffect, useState } from "react";

export default function ClassDetail({ params }: any) {
  const { id } = params;
  const [cls, setCls] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/classes/${id}`)
      .then(r => r.json())
      .then(d => { if (d.success) setCls(d.class); });
  }, [id]);

  if (!cls) return <div>Loading...</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">{cls.name} - Section {cls.section}</h1>

      <div className="mt-4 p-3 border rounded">
        <h2 className="font-semibold">Teachers</h2>
        {cls.teachers.map((t: any) => (
          <div key={t._id}>{t.name} ({t.email})</div>
        ))}
      </div>

      <div className="mt-4 p-3 border rounded">
        <h2 className="font-semibold">Students</h2>
        {cls.students.map((s: any) => (
          <div key={s._id}>{s.firstName} {s.lastName}</div>
        ))}
      </div>
    </div>
  );
}
