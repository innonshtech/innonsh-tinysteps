"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function TimetablePage({ params }: any) {
  const { classId } = params;
  const [timetable, setTimetable] = useState([]);

  useEffect(() => {
    fetch(`/api/parent/timetable/${classId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setTimetable(d.timetable);
      });
  }, [classId]);

  return (
    <div className="p-4">
      <Link href="/parent-portal">
        <button className="border px-4 py-1 rounded">← Back</button>
      </Link>

      <h1 className="text-xl font-bold my-4">Class Timetable</h1>

      <div className="space-y-3">
        {timetable.map((t: any) => (
          <div key={t._id} className="border p-4 rounded shadow-sm">
            <p><strong>Day:</strong> {t.day}</p>
            <p><strong>Subject:</strong> {t.subject}</p>
            <p><strong>Time:</strong> {t.startTime} - {t.endTime}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
