"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function AssessmentsPage({ params }: any) {
  const { studentId } = params;
  const [assessments, setAssessments] = useState([]);

  useEffect(() => {
    fetch(`/api/parent/assessments/${studentId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setAssessments(d.assessments);
      });
  }, [studentId]);

  return (
    <div className="p-4">
      <Link href={`/parent-portal/students/${studentId}`}>
        <button className="border px-4 py-1 rounded">← Back</button>
      </Link>

      <h1 className="text-xl font-bold my-4">Assessments</h1>

      {assessments.length === 0 ? (
        <div>No assessments available yet.</div>
      ) : (
        <div className="space-y-3">
          {assessments.map((a: any) => (
            <div key={a._id} className="border p-4 rounded shadow-sm">
              <h2 className="font-bold">{a.term}</h2>

              <p><strong>Cognitive Skills:</strong> {a.cognitive}</p>
              <p><strong>Motor Skills:</strong> {a.motor}</p>
              <p><strong>Social Skills:</strong> {a.social}</p>

              <p className="mt-2"><strong>Teacher Notes:</strong> {a.notes}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
