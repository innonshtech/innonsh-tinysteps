"use client";
import { useEffect, useState } from "react";

export default function AdmissionDetail({ params }: any) {
  const { id } = params;
  const [ad, setAd] = useState<any>(null);

  useEffect(()=> {
    fetch(`/api/admission/${id}`).then(r=>r.json()).then(d=> { if (d.success) setAd(d.admission) });
  },[id]);

  async function approve() {
    const res = await fetch("/api/admission/approve", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ admissionId: id })});
    const d = await res.json();
    if (d.success) {
      alert("Approved");
      setAd(d.admission);
    } else alert(d.error);
  }

  async function reject() {
    const reason = prompt("Reason for rejection");
    if (!reason) return;
    const res = await fetch("/api/admission/reject", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ admissionId: id, reason })});
    const d = await res.json();
    if (d.success) {
      alert("Rejected");
      setAd(d.admission);
    } else alert(d.error);
  }

  if (!ad) return <div>Loading...</div>;
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">{ad.childFirstName} {ad.childLastName}</h1>
      <div className="mt-4">
        <h3>Parents</h3>
        {ad.parents?.map((p:any,i:number)=>(
          <div key={i}>{p.name} - {p.phone} - {p.email}</div>
        ))}
      </div>

      <div className="mt-4">
        <h3>Documents</h3>
        {ad.documents?.map((d:any,i:number)=> <div key={i}><a href={d.url} target="_blank">{d.name}</a></div>)}
      </div>

      <div className="mt-6 flex gap-2">
        <button onClick={approve} className="bg-green-600 text-white px-3 py-1 rounded">Approve</button>
        <button onClick={reject} className="bg-red-600 text-white px-3 py-1 rounded">Reject</button>
      </div>
    </div>
  );
}
