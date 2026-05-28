"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NotificationsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.push("/dashboard/notifications");
  }, [router]);

  return null;
}
