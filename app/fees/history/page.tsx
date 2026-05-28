"use client";
import { useEffect, useState } from "react";
import FeeHistoryList from "@/components/fees/FeeHistoryList";

export default function FeesHistoryPage() {
  const [items, setItems] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  // ✅ FIXED useEffect
  useEffect(() => {
    fetchPage(1);
  }, []);

  async function fetchPage(p: number) {
    const res = await fetch(`/api/fees/history?page=${p}&limit=12`);
    const d = await res.json();

    if (d.success) {
      setItems(d.items);
      setPage(d.pagination.page);
      setPages(d.pagination.pages);
    }
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl">Fees History</h1>

      <FeeHistoryList items={items} />

      <div className="flex gap-2 mt-4">
        <button disabled={page <= 1} onClick={() => fetchPage(page - 1)}>
          Prev
        </button>

        <div>Page {page} / {pages}</div>

        <button disabled={page >= pages} onClick={() => fetchPage(page + 1)}>
          Next
        </button>
      </div>
    </div>
  );
}
