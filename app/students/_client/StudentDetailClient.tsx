"use client";
import React, { useEffect, useState } from "react";
import StudentForm from "@/components/students/StudentForm";
import useStudents from "@/hooks/useStudents";
import { useRouter } from "next/navigation";

export default function StudentDetailClient({ studentId }: { studentId: string }) {
  const [student, setStudent] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch(`/api/students/${studentId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setStudent(d.student);
        else setStudent(null);
      })
      .finally(() => setLoading(false));
  }, [studentId]);

  async function handleDelete() {
    if (!confirm("Delete this student?")) return;
    const res = await fetch(`/api/students/${studentId}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) {
      router.push("/students");
    } else {
      alert(data.error || "Delete failed");
    }
  }

  if (loading) return <div>Loading student...</div>;
  if (!student) return <div>Student not found</div>;

  return (
    <div>
      <h1>{student.firstName} {student.lastName}</h1>
      <div className="mb-4">
        <button onClick={handleDelete}>Delete</button>
      </div>
      <div className="mb-6">
        <h2>Edit</h2>
        <StudentForm initial={student} onSuccess={() => window.location.reload()} />
      </div>

      <div>
        <h3>Details</h3>
        <pre>{JSON.stringify(student, null, 2)}</pre>
      </div>
    </div>
  );
}
