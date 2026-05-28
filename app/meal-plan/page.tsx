"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function MealPlanRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.push("/dashboard/meal-plan");
  }, [router]);

  return null;
}
