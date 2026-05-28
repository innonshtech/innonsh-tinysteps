"use client";
import React, { useState, useEffect } from "react";

export default function MarkAttendancePage() {
  const [students, setStudents] = useState<any[]>([]);
  const [entries, setEntries] = useState<any>({});
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0,10));
  const [classId, setClassId] = useState<string>("");

  useEffect(() => {
    // fetch students in class if classId present; otherwise fetch all
    fetch(`/api/students?classId=${classId}`)
      .then(r => r.json())
      .then(d => { if (d.success) setStudents(d.students) });
  }, [classId]);

  function setStatus(studentId: string, status: string) {
    setEntries((p:any) => ({ ...p, [studentId]: status }));
  }

  async function submit() {
    const payload = {
      entries: students.map(s => ({ studentId: s._id, status: entries[s._id] || "present" })),
      date,
      classId,
    };
    const res = await fetch("/api/teachers/attendance/mark", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const data = await res.json();
    if (data.success) alert("Attendance saved");
    else alert(data.error || "Error");
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl">Mark Attendance</h1>
      <div className="my-3">
        <label>ClassId (optional):</label>
        <input value={classId} onChange={(e)=>setClassId(e.target.value)} />
        <label>Date:</label>
        <input type="date" value={date} onChange={(e)=>setDate(e.target.value)} />
      </div>

      <div className="grid gap-2">
        {students.map(s => (
          <div key={s._id} className="flex gap-4 items-center border p-2 rounded">
            <div>{s.firstName} {s.lastName}</div>
            <select value={entries[s._id] || "present"} onChange={(e)=>setStatus(s._id, e.target.value)}>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="late">Late</option>
              <option value="excused">Excused</option>
            </select>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <button onClick={submit}>Save Attendance</button>
      </div>
    </div>
  );
}
