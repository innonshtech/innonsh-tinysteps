"use client";
import React, { useState, ChangeEvent, FormEvent } from "react";
import { TeacherCreateZ } from "@/lib/validations/teacherSchema";
import { useRouter } from "next/navigation";
import { z } from "zod";

type TeacherCreate = z.infer<typeof TeacherCreateZ>;

interface InitialTeacher {
  name?: string;
  email?: string;
  phone?: string;
  subjects?: string[];
  qualifications?: string[];
  password?: string;
}

interface Teacher extends TeacherCreate {
  _id: string;
}

interface TeacherFormProps {
  initial?: InitialTeacher;
  onSuccess?: (teacher: Teacher) => void;
}

export default function TeacherForm({ initial = {}, onSuccess }: TeacherFormProps) {
  const [form, setForm] = useState({
    name: initial.name || "",
    email: initial.email || "",
    phone: initial.phone || "",
    subjects: (initial.subjects || []).join(", "),
    qualifications: (initial.qualifications || []).join(", "),
    password: initial.password || "",
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  function onChange(e: ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      const payload: TeacherCreate = {
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone,
        subjects: form.subjects ? form.subjects.split(",").map((s: string) => s.trim()) : [],
        qualifications: form.qualifications
          ? form.qualifications.split(",").map((s: string) => s.trim())
          : [],
      };
      TeacherCreateZ.parse(payload);
      const res = await fetch("/api/teachers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      setLoading(false);
      if (!data.success) throw new Error(data.error || "Failed");
      onSuccess?.(data.teacher);
      router.push("/teachers");
    } catch (err) {
      setLoading(false);
      alert(err instanceof Error ? err.message : "Error");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
        <input
          name="name"
          value={form.name}
          onChange={onChange}
          required
          placeholder="Enter teacher name"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <input
          name="email"
          value={form.email}
          onChange={onChange}
          required
          type="email"
          placeholder="Enter email address"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
        <input
          name="password"
          value={form.password}
          onChange={onChange}
          required
          type="password"
          placeholder="Enter password (min 6 characters)"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
        <input
          name="phone"
          value={form.phone}
          onChange={onChange}
          placeholder="Enter phone number"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Subjects (comma separated)
        </label>
        <input
          name="subjects"
          value={form.subjects}
          onChange={onChange}
          placeholder="e.g., Math, Science, English"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Qualifications (comma separated)
        </label>
        <input
          name="qualifications"
          value={form.qualifications}
          onChange={onChange}
          placeholder="e.g., B.Ed, M.Sc"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>
      <div>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-blue-300"
        >
          {loading ? "Saving..." : "Save"}
        </button>
      </div>
    </form>
  );
}