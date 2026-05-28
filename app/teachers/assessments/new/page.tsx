"use client";
import React, { useState } from "react";

export default function NewAssessmentPage() {
  const [form, setForm] = useState({ studentId: "", term: "", cognitive: "", motor: "", social: "", notes: "" });

  function onChange(e:any) {
    setForm((p:any)=>({...p, [e.target.name]: e.target.value}));
  }

  async function submit() {
    const res = await fetch("/api/teachers/assessments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const data = await res.json();
    if (data.success) {
      alert("Saved");
      setForm({ studentId: "", term: "", cognitive:"", motor:"", social:"", notes:"" });
    } else alert(data.error || "Error");
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl">New Assessment</h1>
      <div className="grid gap-3 max-w-xl">
        <input name="studentId" placeholder="Student ID" value={form.studentId} onChange={onChange} />
        <input name="term" placeholder="Term" value={form.term} onChange={onChange} />
        <textarea name="cognitive" placeholder="Cognitive" value={form.cognitive} onChange={onChange} />
        <textarea name="motor" placeholder="Motor" value={form.motor} onChange={onChange} />
        <textarea name="social" placeholder="Social" value={form.social} onChange={onChange} />
        <textarea name="notes" placeholder="Notes" value={form.notes} onChange={onChange} />
        <button onClick={submit}>Save</button>
      </div>
    </div>
  );
}
