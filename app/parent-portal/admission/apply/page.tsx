// app/parent-portal/admission/apply/page.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ParentAdmissionApply() {
  const [form, setForm] = useState({
    childFirstName: "",
    childLastName: "",
    dob: "",
    gender: "",
    preferredClass: "",
    parents: [{ name: "", phone: "", email: "", relation: "" }],
    documents: []
  });
  const [uploading, setUploading] = useState(false);
  const router = useRouter();

  function setParent(i:number, key:string, val:string) {
    const p = [...form.parents];
    p[i] = { ...p[i], [key]: val };
    setForm({ ...form, parents: p });
  }

  function addParent() {
    setForm({ ...form, parents: [...form.parents, { name: "", phone: "", email: "", relation: "" }] });
  }

  async function handleFile(e:any) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const data = new FormData();
    data.append("file", file);
    const res = await fetch("/api/admission/upload", { method: "POST", body: data });
    const d = await res.json();
    setUploading(false);
    if (d.success) {
      setForm((p:any) => ({ ...p, documents: [...(p.documents || []), { name: file.name, url: d.url }] }));
    } else {
      alert(d.error || "Upload failed");
    }
  }

  async function submit() {
    const payload = { ...form };
    const res = await fetch("/api/admission/apply", { method: "POST", headers: { "Content-Type":"application/json" }, body: JSON.stringify(payload) });
    const d = await res.json();
    if (d.success) {
      alert("Application submitted");
      router.push("/parent-portal/admission/status");
    } else alert(d.error || "Failed");
  }

  return (
    <div className="p-4 max-w-2xl">
      <h1 className="text-2xl font-bold">Admission Application</h1>

      <div className="mt-4 grid gap-3">
        <input placeholder="Child first name" value={form.childFirstName} onChange={(e)=>setForm({...form, childFirstName: e.target.value})} />
        <input placeholder="Child last name" value={form.childLastName} onChange={(e)=>setForm({...form, childLastName: e.target.value})} />
        <label>DOB</label><input type="date" value={form.dob} onChange={(e)=>setForm({...form, dob: e.target.value})} />
        <select value={form.gender} onChange={(e)=>setForm({...form, gender: e.target.value})}>
          <option value="">Gender</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option>
        </select>
        <input placeholder="Preferred Class (e.g., KG1)" value={form.preferredClass} onChange={(e)=>setForm({...form, preferredClass: e.target.value})} />

        <div>
          <h3>Parents / Guardians</h3>
          {form.parents.map((p:any,i:number)=>(
            <div key={i} className="grid gap-2">
              <input placeholder="Name" value={p.name} onChange={(e)=>setParent(i,"name",e.target.value)} />
              <input placeholder="Phone" value={p.phone} onChange={(e)=>setParent(i,"phone",e.target.value)} />
              <input placeholder="Email" value={p.email} onChange={(e)=>setParent(i,"email",e.target.value)} />
              <input placeholder="Relation" value={p.relation} onChange={(e)=>setParent(i,"relation",e.target.value)} />
            </div>
          ))}
          <button onClick={addParent}>Add another parent</button>
        </div>

        <div>
          <label>Upload documents</label>
          <input type="file" onChange={handleFile} />
          {uploading && <div>Uploading...</div>}
          <div>
            {form.documents.map((d:any,i:number)=> <div key={i}><a href={d.url} target="_blank">{d.name}</a></div>)}
          </div>
        </div>

        <div className="mt-4">
          <button onClick={submit}>Submit Application</button>
        </div>
      </div>
    </div>
  );
}
