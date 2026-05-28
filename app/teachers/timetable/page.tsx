"use client";
import { useEffect, useState } from "react";

export default function TeacherTimeTable() {
  const [timetable, setTimetable] = useState([]);

  useEffect(() => {
    fetch("/api/me")        // You should create /api/me to return logged-in user
      .then(r => r.json())
      .then(async (user) => {
        if (user?.user?.role === "teacher") {
          const res = await fetch(`/api/timetable/teacher/${user.user._id}`);
          const data = await res.json();
          if (data.success) setTimetable(data.timetable);
        }
      });
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold">My Timetable</h1>

      <div className="space-y-3">
        {timetable.map((t: any) => (
          <div key={t._id} className="border p-3 rounded">
            <p><strong>{t.day}</strong></p>
            <p>{t.subject}</p>
            <p>{t.startTime} - {t.endTime}</p>
            <p>Class: {t.classId?.name} {t.classId?.section}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
