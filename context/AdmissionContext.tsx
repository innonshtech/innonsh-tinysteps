"use client";
import React, { createContext, useContext, useState } from "react";

const AdmissionContext = createContext<any>(null);

export function AdmissionProvider({ children }: any) {
  const [admissions, setAdmissions] = useState<any[]>([]);
  const fetchAll = async () => {
    const res = await fetch("/api/admission/list");
    const d = await res.json();
    if (d.success) setAdmissions(d.admissions || []);
  };
  return <AdmissionContext.Provider value={{ admissions, fetchAll }}>{children}</AdmissionContext.Provider>;
}

export const useAdmission = () => useContext(AdmissionContext);
