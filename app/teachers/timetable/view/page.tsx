"use client";
import { useEffect, useState } from "react";

export default function TeacherTimetableView() {
  const [timetable, setTimetable] = useState<any[]>([]);
  useEffect(() => {
    fetch("/api/timetable") // teacher can fetch class timetables filtered server-side if needed
      .then(r => r.json())
      .then(d => { if (d.success) setTimetable(d.timetable); });
  }, []);
  return (
    <div className="p-4">
      <h1 className="text-2xl">Timetable</h1>
      <div className="grid gap-3">
        {timetable.map(tt => (
          <div key={tt._id} className="border p-3 rounded">
            <div><strong>{tt.day}</strong> {tt.startTime} - {tt.endTime}</div>
            <div>{tt.subject} — Class {tt.classId}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
