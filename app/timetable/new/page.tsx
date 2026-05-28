"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function NewTimetablePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    classId: "",
    day: "Monday",
    subject: "",
    teacherId: "",
    startTime: "",
    endTime: "",
    roomNumber: "",
  });

  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);

  useEffect(() => {
    fetch("/api/classes").then(r => r.json()).then(d => {
      if (d.success) setClasses(d.classes);
    });

    fetch("/api/teachers").then(r => r.json()).then(d => {
      if (d.success) setTeachers(d.teachers);
    });
  }, []);

  function onChange(e: any) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function submit() {
    const res = await fetch("/api/timetable", {
      method: "POST",
      body: JSON.stringify(form),
      headers: { "Content-Type": "application/json" }
    });
    const data = await res.json();

    if (data.success) router.push("/timetable");
    else alert(data.error);
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl">Create Timetable Entry</h1>

      <select name="classId" onChange={onChange}>
        <option>Choose Class</option>
        {classes.map((c: any) => (
          <option key={c._id} value={c._id}>{c.name} {c.section}</option>
        ))}
      </select>

      <select name="day" onChange={onChange}>
        {["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"].map(d => (
          <option key={d} value={d}>{d}</option>
        ))}
      </select>

      <input name="subject" placeholder="Subject" onChange={onChange} />
      <select name="teacherId" onChange={onChange}>
        <option>Choose Teacher</option>
        {teachers.map((t: any) => (
          <option key={t._id} value={t._id}>{t.name}</option>
        ))}
      </select>

      <input type="time" name="startTime" onChange={onChange} />
      <input type="time" name="endTime" onChange={onChange} />
      <input name="roomNumber" placeholder="Room #" onChange={onChange} />

      <button onClick={submit}>Save</button>
    </div>
  );
}
