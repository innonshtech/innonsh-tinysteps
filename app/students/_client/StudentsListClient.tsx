"use client";
import React, { useEffect, useState } from "react";
import StudentTable from "@/components/students/StudentTable";
import Link from "next/link";

export default function StudentsListClient() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageInfo, setPageInfo] = useState({ page: 1, limit: 10, pages: 1, total: 0 });

  async function fetchPage(page = 1) {
    setLoading(true);
    try {
      const res = await fetch(`/api/students?page=${page}&limit=${pageInfo.limit}`);
      const data = await res.json();
      if (data.success) {
        setStudents(data.students);
        setPageInfo((p) => ({ ...p, page: data.pagination.page, pages: data.pagination.pages, total: data.pagination.total }));
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPage(1);
  }, []);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2>All Students</h2>
        <Link href="/students/new"><button>Create Student</button></Link>
      </div>

      {loading ? <div>Loading...</div> : <StudentTable students={students} />}

      <div className="flex gap-2 items-center mt-4">
        <button disabled={pageInfo.page <= 1} onClick={() => fetchPage(pageInfo.page - 1)}>Prev</button>
        <div>Page {pageInfo.page} / {pageInfo.pages} — Total {pageInfo.total}</div>
        <button disabled={pageInfo.page >= pageInfo.pages} onClick={() => fetchPage(pageInfo.page + 1)}>Next</button>
      </div>
    </div>
  );
}
