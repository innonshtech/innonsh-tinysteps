import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import FeeTransaction from "@/models/FeeTransaction";
import FeeStructure from "@/models/FeeStructure";
import { verifyToken } from "@/lib/auth";
import { FeeCollectZ } from "@/lib/validations/feeSchema";

// --- FIX: Proper fee structure type ---
interface IFeeStructure {
  _id: string;
  finePerDay?: number;
  heads?: { name: string; amount: number }[];
  [key: string]: any;
}

export async function POST(req: Request) {
  await connectDB();

  const token = req.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];
  const user = verifyToken(token);
  if (!user || !["admin", "finance", "teacher"].includes(user.role)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const payload = FeeCollectZ.parse(body);

    // Calculate fine
    let fineAmount = 0;

    if (payload.structureId) {
      const structure =
        (await FeeStructure.findById(payload.structureId).lean<IFeeStructure>()) as
          | IFeeStructure
          | null;

      if (structure && structure.finePerDay && structure.heads?.length) {
        fineAmount = 0; // Your calculation placeholder
      }
    }

    // Determine amount due
    const amountPaid = payload.amount;
    const amountDue =
      (payload.items?.reduce((s: any, i: any) => s + i.amount, 0) || 0) + fineAmount;

    const status =
      amountPaid >= amountDue
        ? "paid"
        : amountPaid > 0
        ? "partial"
        : "due";

const tx = await FeeTransaction.create({
  studentId: payload.studentId,
  parentId: user.role === "parent" ? user.id : null,   // ✅ FIXED
  structureId: payload.structureId || null,
  items: payload.items || [],
  amountDue,
  amountPaid,
  fineAmount,
  status,
  paymentMethod: payload.paymentMethod || "cash",
  paymentMeta: payload.paymentMeta || null,
  createdBy: user.id,
  note: payload.note || null,
  receipts: []
});


    return NextResponse.json({ success: true, transaction: tx }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Invalid data" },
      { status: 400 }
    );
  }
}
