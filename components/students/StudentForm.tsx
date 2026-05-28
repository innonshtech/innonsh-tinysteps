// components/students/StudentForm.tsx
"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { StudentCreateZ } from "@/lib/validations/studentSchema";

type Props = {
  initial?: any;
  onSuccess?: (s: any) => void;
};

export default function StudentForm({ initial = {}, onSuccess }: Props) {
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: initial.firstName || "",
    lastName: initial.lastName || "",
    dob: initial.dob ? initial.dob.slice(0, 10) : "",
    gender: initial.gender || "",
    admissionNo: initial.admissionNo || "",
    admissionDate: initial.admissionDate ? initial.admissionDate.slice(0, 10) : "",
    documents: initial.documents || [],
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const data = new FormData();
      data.append("file", file);
      const res = await fetch("/api/students/upload", { method: "POST", body: data });
      const json = await res.json();
      setUploading(false);
      if (!json.success) throw new Error(json.error || "Upload failed");
      setForm((p) => ({ ...p, documents: [...(p.documents || []), { name: file.name, url: json.url }] }));
    } catch (err: any) {
      setUploading(false);
      setError(err.message || "Upload failed");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    try {
      StudentCreateZ.parse({
        firstName: form.firstName,
      });

      setLoading(true);
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      setLoading(false);
      if (!data.success) throw new Error(data.error || "Failed");
      onSuccess?.(data.student);
      router.push("/students");
    } catch (err: any) {
      setLoading(false);
      setError(err?.message || "Validation failed");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="text-red-600">{error}</div>}
      <div>
        <label>First name</label>
        <input name="firstName" value={form.firstName} onChange={onChange} required />
      </div>
      <div>
        <label>Upload document / image</label>
        <input type="file" onChange={handleFile} />
        {uploading && <div>Uploading...</div>}
        <div>
          {(form.documents || []).map((d: any, idx: number) => (
            <div key={idx}><a href={d.url} target="_blank">{d.name}</a></div>
          ))}
        </div>
      </div>
      <div>
        <button type="submit" disabled={loading}>{loading ? "Saving..." : "Save Student"}</button>
      </div>
    </form>
  );
}
