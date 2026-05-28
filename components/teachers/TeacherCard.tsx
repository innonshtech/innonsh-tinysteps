"use client";
import Link from "next/link";
export default function TeacherCard({ teacher }: any) {
  return (
    <div className="border p-3 rounded">
      <h3 className="font-semibold">{teacher.name}</h3>
      <div>{teacher.email}</div>
      <div>{teacher.subjects?.join?.(", ")}</div>
      <div className="mt-2">
        <Link href={`/teachers/${teacher._id}`}><button>View</button></Link>
      </div>
    </div>
  );
}
