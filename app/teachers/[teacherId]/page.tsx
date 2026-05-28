"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import TeacherForm from "@/components/teachers/TeacherForm";

export default function TeacherDetail({ params }: any) {
  const { teacherId } = params;
  const [teacher, setTeacher] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch(`/api/teachers/${teacherId}`).then(r => r.json()).then(d => {
      if (d.success) setTeacher(d.teacher);
    }).finally(() => setLoading(false));
  }, [teacherId]);

  async function handleDelete() {
    if (!confirm("Delete teacher?")) return;
    const res = await fetch(`/api/teachers/${teacherId}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) router.push("/teachers");
    else alert(data.error || "Delete failed");
  }

  if (loading) return <div>Loading...</div>;
  if (!teacher) return <div>Not found</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">{teacher.name}</h1>

      <div className="mt-4">
        <h2 className="font-semibold">Edit</h2>
        <TeacherForm initial={teacher} onSuccess={() => window.location.reload()} />
      </div>

      <div className="mt-6">
        <button onClick={handleDelete} className="bg-red-500 text-white px-3 py-1 rounded">Delete</button>
      </div>
    </div>
  );
}
