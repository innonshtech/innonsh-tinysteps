"use client";
import React, { createContext, useContext, useState } from "react";

const FeeContext = createContext<any>(null);

export function FeeProvider({ children }: any) {
  const [structures, setStructures] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  async function fetchStructures() {
    setLoading(true);
    try {
      const res = await fetch("/api/fees");
      const d = await res.json();
      if (d.success) setStructures(d.items || []);
    } finally { setLoading(false); }
  }

  async function fetchTransactions(page = 1) {
    setLoading(true);
    try {
      const res = await fetch(`/api/fees/history?page=${page}`);
      const d = await res.json();
      if (d.success) setTransactions(d.items || []);
    } finally { setLoading(false); }
  }

  return (
    <FeeContext.Provider value={{ structures, transactions, loading, fetchStructures, fetchTransactions }}>
      {children}
    </FeeContext.Provider>
  );
}

export const useFeeContext = () => useContext(FeeContext);
