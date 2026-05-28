"use client";
import TeacherCard from "./TeacherCard";
export default function TeacherTable({ teachers }: { teachers: any[] }) {
  if (!teachers?.length) return <div>No teachers yet.</div>;
  return <div className="grid gap-3">{teachers.map(t => <TeacherCard key={t._id} teacher={t} />)}</div>;
}
