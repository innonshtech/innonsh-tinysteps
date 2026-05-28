// app/fees/new/page.tsx
"use client";
import { useRouter } from "next/navigation";
import FeeStructureForm from "@/components/fees/FeeStructureForm";

interface FeeStructure {
  _id: string;
  name: string;
  heads: { title: string; amount: number }[];
  finePerDay: number;
}

export default function NewFeeStructure() {
  const router = useRouter();

  return (
    <div className="p-4">
      <h1 className="text-2xl">New Fee Structure</h1>
      <FeeStructureForm onSaved={(item: FeeStructure) => router.push("/fees")} />
    </div>
  );
}