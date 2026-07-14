import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { FeeTransactionRepository } from "@/repositories/fee.repository";

export async function GET(req: Request) {
  const token = req.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];
  const user = verifyToken(token);
  if (!user || !["admin","finance","teacher"].includes(user.role)) return NextResponse.json({ success:false, error:"Unauthorized" }, { status:403 });

  const url = new URL(req.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
  const limit = Math.max(1, Math.min(100, parseInt(url.searchParams.get("limit") || "20")));
  const skip = (page - 1) * limit;

  const filter: any = {};
  if (url.searchParams.get("studentId")) filter.student_id = url.searchParams.get("studentId");
  if (url.searchParams.get("status")) filter.status = url.searchParams.get("status");

  const feeTxRepo = new FeeTransactionRepository();
  const { data, total } = await feeTxRepo.findWithDetails(filter, { skip, limit, sort: { field: "created_at", ascending: false } });

  const items = data.map((tx: any) => ({
      _id: tx.id,
      id: tx.id,
      studentId: tx.student_id,
      parentId: tx.parent_id,
      structureId: tx.structure_id,
      amountDue: tx.amount_due,
      amountPaid: tx.amount_paid,
      fineAmount: tx.fine_amount,
      status: tx.status,
      items: tx.items.map((i: any) => ({ name: i.head, amount: i.amount })),
      dueDate: tx.due_date,
      note: tx.note,
      createdAt: tx.created_at,
      updatedAt: tx.updated_at
  }));

  return NextResponse.json({ success: true, items, pagination: { page, limit, total, pages: Math.ceil(total/limit) }});
}
