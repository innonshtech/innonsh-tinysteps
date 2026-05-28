"use client";
import React, { createContext, useState, useContext, useEffect } from "react";

type Student = any;

const StudentContext = createContext<any>(null);

export function StudentProvider({ children }: { children: React.ReactNode }) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);

  async function fetchAll() {
    setLoading(true);
    try {
      const res = await fetch("/api/students");
      const data = await res.json();
      if (data.success) setStudents(data.students || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAll();
  }, []);

  const addStudent = (s: Student) => setStudents((p) => [s, ...p]);
  const updateStudent = (s: Student) =>
    setStudents((p) => p.map((x) => (x._id === s._id ? s : x)));
  const removeStudent = (id: string) => setStudents((p) => p.filter((x) => x._id !== id));

  return (
    <StudentContext.Provider value={{ students, loading, fetchAll, addStudent, updateStudent, removeStudent }}>
      {children}
    </StudentContext.Provider>
  );
}

export const useStudentsContext = () => useContext(StudentContext);
