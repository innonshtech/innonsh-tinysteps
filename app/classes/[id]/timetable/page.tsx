"use client";
import { useEffect, useState } from "react";

export default function ClassTimetablePage({ params }: any) {
  const { id } = params;
  const [timetable, setTimetable] = useState([]);

  useEffect(() => {
    fetch(`/api/timetable/class/${id}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) setTimetable(d.timetable);
      });
  }, [id]);

  return (
    <div className="p-4 space-y-3">
      <h1 className="text-xl font-bold">Class Timetable</h1>

      {timetable.map((p: any) => (
        <div key={p._id} className="border p-3 rounded">
          <p><strong>{p.day}</strong></p>
          <p>{p.subject}</p>
          <p>{p.startTime} - {p.endTime}</p>
          <p>Teacher: {p.teacherId?.name}</p>
        </div>
      ))}
    </div>
  );
}
