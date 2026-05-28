import React from "react";
import StudentDetailClient from "../_client/StudentDetailClient";

type Props = { params: Promise<{ studentId: string }> };

export default async function StudentDetailPage({ params }: Props) {
  const { studentId } = await params;
  return <StudentDetailClient studentId={studentId} />;
}
