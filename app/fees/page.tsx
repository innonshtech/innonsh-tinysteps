"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function FeesRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.push("/dashboard/fees");
  }, [router]);

  return null;
}
