"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function GalleryRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.push("/dashboard/gallery");
  }, [router]);

  return null;
}
