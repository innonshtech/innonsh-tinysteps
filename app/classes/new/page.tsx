"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewClassPage() {
  const [form, setForm] = useState({ name: "", section: "A", roomNumber: "" });
  const router = useRouter();

  function onChange(e: any) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function submit() {
    const res = await fetch("/api/classes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    const data = await res.json();
    if (data.success) router.push("/classes");
    else alert(data.error);
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl">Create New Class</h1>

      <input placeholder="Class Name" name="name" onChange={onChange} className="border p-2 rounded" />
      <input placeholder="Section" name="section" onChange={onChange} className="border p-2 rounded" />
      <input placeholder="Room Number" name="roomNumber" onChange={onChange} className="border p-2 rounded" />
      
      <button onClick={submit}>Save</button>
    </div>
  );
}
