import React from "react";
import StudentProfile from "@/components/admin/StudentProfile";

export default async function StudentProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <StudentProfile studentId={id} />;
}
