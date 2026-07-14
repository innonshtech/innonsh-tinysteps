import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { parentOwnsStudent } from "@/lib/parent";
import { FeeTransactionRepository } from "@/repositories/fee.repository";

export async function GET(req: Request, context: any) {
  const { studentId } = await context.params;

  const token = req.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];
  const parent = verifyToken(token);
  if (!parent || parent.role !== "parent") return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });

  const student = await parentOwnsStudent(studentId, parent.id, (parent as any).email);
  if (!student) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

  // return transactions for this student
  const repo = new FeeTransactionRepository();
  const tx = await repo.find({ student_id: studentId }, { sort: { field: 'created_at', ascending: false } });
  
  const totalPaid = tx.reduce((s: any, t: any) => s + (t.amount_paid || 0), 0);
  const totalDue = tx.reduce((s: any, t: any) => s + ((t.amount_due || 0) - (t.amount_paid || 0)), 0);

  // Map to frontend expected format
  const mappedTx = tx.map(t => ({
      ...t,
      _id: t.id,
      amountPaid: t.amount_paid,
      amountDue: t.amount_due,
      createdAt: t.created_at,
      fineAmount: t.fine_amount
  }));

  return NextResponse.json({ success: true, fees: mappedTx, totalPaid, totalDue });
}
