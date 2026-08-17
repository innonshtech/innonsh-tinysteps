import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { FeeStructureRepository } from "@/repositories/fee.repository";

function mapStructure(i: {
  id: string;
  name: string;
  class_id: string | null;
  fine_per_day: number;
  description?: string | null;
  active: boolean;
  class?: { id: string; name: string; section: string } | null;
  heads?: Array<{
    id: string;
    title: string;
    amount: number;
    frequency: string;
    due_date_day: number;
  }>;
}) {
  return {
    _id: i.id,
    id: i.id,
    name: i.name,
    classId: i.class
      ? { _id: i.class.id, name: i.class.name, section: i.class.section }
      : i.class_id,
    finePerDay: i.fine_per_day,
    description: i.description,
    active: i.active,
    heads: (i.heads ?? []).map((h) => ({
      _id: h.id,
      title: h.title,
      amount: h.amount,
      frequency: h.frequency,
      dueDateDay: h.due_date_day,
    })),
  };
}

export async function GET(req: Request) {
  const token = req.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];
  const user = verifyToken(token);
  if (!user || !["admin", "finance", "teacher"].includes(user.role)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }

  const classId = new URL(req.url).searchParams.get("classId");
  if (!classId) {
    return NextResponse.json({ success: false, error: "classId is required" }, { status: 400 });
  }

  try {
    const repo = new FeeStructureRepository();
    const all = await repo.findWithHeads({});

    const structures = all
      .filter((s) => s.active !== false && (s.class_id === classId || !s.class_id))
      .map((row) => mapStructure(row as Parameters<typeof mapStructure>[0]));

    return NextResponse.json({ success: true, structures });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load fee structures";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
