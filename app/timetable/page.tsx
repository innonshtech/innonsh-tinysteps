"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function TimetablePage() {
  const [timetable, setTimetable] = useState([]);

  useEffect(() => {
    fetch("/api/timetable")
      .then(r => r.json())
      .then(d => {
        if (d.success) setTimetable(d.timetable);
      });
  }, []);

  return (
    <div className="p-4">
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold">Timetable</h1>
        <Link href="/timetable/new"><button>Create Entry</button></Link>
      </div>

      <div className="space-y-4">
        {timetable.map((t: any) => (
          <div key={t._id} className="border p-3 rounded">
            <div><strong>Class:</strong> {t.classId?.name} {t.classId?.section}</div>
            <div><strong>Day:</strong> {t.day}</div>
            <div><strong>Subject:</strong> {t.subject}</div>
            <div><strong>Time:</strong> {t.startTime} - {t.endTime}</div>
            <div><strong>Teacher:</strong> {t.teacherId?.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
