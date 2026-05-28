import React from "react";
import { StudentProvider } from "@/context/StudentContext";
import StudentForm from "@/components/students/StudentForm";

export default function NewStudentPage() {
  return (
    <StudentProvider>
      <div className="page">
        <h1>New Student</h1>
        <StudentForm />
      </div>
    </StudentProvider>
  );
}
