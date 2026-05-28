"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ExamsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.push("/dashboard/exams");
  }, [router]);

  return null;
}
