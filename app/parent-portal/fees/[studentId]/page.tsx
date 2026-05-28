"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function ParentFeesPage({ params }: any) {
  const { studentId } = params;
  const [fees, setFees] = useState([]);
  const [totalPaid, setTotalPaid] = useState(0);

  useEffect(() => {
    fetch(`/api/parent/fees/${studentId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setFees(d.fees);
          setTotalPaid(d.totalPaid || 0);
        }
      });
  }, [studentId]);

  return (
    <div className="p-4">
      <Link href={`/parent-portal/students/${studentId}`}>
        <button className="border px-4 py-1 rounded">← Back</button>
      </Link>

      <h1 className="text-xl font-bold my-4">Fees</h1>

      <div className="mb-4 font-semibold">Total Paid: ₹{totalPaid}</div>

      <div className="space-y-4">
        {fees.map((f: any) => (
          <div key={f._id} className="border p-4 rounded shadow">
            <p><strong>Amount:</strong> ₹{f.amount}</p>
            <p><strong>Date:</strong> {new Date(f.date).toLocaleDateString()}</p>
            <p><strong>Status:</strong> {f.status}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
