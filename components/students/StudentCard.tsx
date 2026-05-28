"use client";
import React from "react";
import Link from "next/link";

export default function StudentCard({ student }: { student: any }) {
  return (
    <div className="card p-4 shadow">
      <h3>{student.firstName} {student.lastName || ""}</h3>
      <div>Admission No: {student.admissionNo || "-"}</div>
      <div>DOB: {student.dob ? new Date(student.dob).toLocaleDateString() : "-"}</div>
      <div>Class: {student.classId ? String(student.classId) : "-"}</div>
      <div className="mt-2">
        <Link href={`/students/${student._id}`}><button>View</button></Link>
      </div>
    </div>
  );
}
