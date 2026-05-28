"use client";
export default function FeeHistoryList({ items }: any) {
  if (!items?.length) return <div>No transactions</div>;
  return (
    <div className="space-y-3">
      {items.map((t:any)=>(
        <div key={t._id} className="border p-3 rounded">
          <div><strong>Student:</strong> {t.studentId}</div>
          <div><strong>Paid:</strong> ₹{t.amountPaid} — <strong>Status:</strong> {t.status}</div>
          <div><strong>Items:</strong> {t.items?.map((i:any)=>i.head+"₹"+i.amount).join(", ")}</div>
          <div><strong>Date:</strong> {new Date(t.createdAt).toLocaleString()}</div>
        </div>
      ))}
    </div>
  );
}
