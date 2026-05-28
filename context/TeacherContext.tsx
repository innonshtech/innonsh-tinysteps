"use client";
import React, { createContext, useContext, useState, useEffect } from "react";

const TeacherContext = createContext<any>(null);

export function TeacherProvider({ children }: { children: React.ReactNode }) {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  async function fetchAll() {
    setLoading(true);
    try {
      const res = await fetch("/api/teachers");
      const data = await res.json();
      if (data.success) setTeachers(data.teachers || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAll();
  }, []);

  const add = (t: any) => setTeachers((p) => [t, ...p]);
  const update = (t: any) => setTeachers((p) => p.map((x) => (x._id === t._id ? t : x)));
  const remove = (id: string) => setTeachers((p) => p.filter((x) => x._id !== id));

  return (
    <TeacherContext.Provider value={{ teachers, loading, fetchAll, add, update, remove }}>
      {children}
    </TeacherContext.Provider>
  );
}

export const useTeachersContext = () => useContext(TeacherContext);
