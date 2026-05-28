"use client";
import React from "react";
import useTeachers from "@/hooks/useTeachers";
import TeacherTable from "@/components/teachers/TeacherTable";
import Link from "next/link";

export default function TeachersListClient() {
  const { teachers, loading, fetchAll } = useTeachers();

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2>All Teachers</h2>
        <Link href="/teachers/new"><button>Create Teacher</button></Link>
      </div>

      {loading ? <div>Loading...</div> : <TeacherTable teachers={teachers} />}
      <div className="mt-4"><button onClick={fetchAll}>Refresh</button></div>
    </div>
  );
}
