import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { FeeCollectZ } from "@/lib/validations/feeSchema";
import { FeeTransactionRepository, FeeTransactionItemRepository, FeeStructureRepository } from "@/repositories/fee.repository";

export async function POST(req: Request) {
  const token = req.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];
  const user = verifyToken(token);
  if (!user || !["admin", "finance", "teacher", "parent"].includes(user.role)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const payload = FeeCollectZ.parse(body);

    let fineAmount = 0;

    const structRepo = new FeeStructureRepository();

    if (payload.structureId) {
      const structures = await structRepo.findWithHeads({ id: payload.structureId });
      const structure = structures.length > 0 ? structures[0] : null;

      if (structure && structure.fine_per_day && structure.heads?.length) {
        fineAmount = 0; // Calculation placeholder
      }
    }

    const amountPaid = payload.amount;
    const amountDue =
      (payload.items?.reduce((s: any, i: any) => s + i.amount, 0) || 0) + fineAmount;

    const status =
      amountPaid >= amountDue
        ? "paid"
        : amountPaid > 0
        ? "partial"
        : "due";

    const feeTxRepo = new FeeTransactionRepository();
    const feeTxItemRepo = new FeeTransactionItemRepository();

    const tx = await feeTxRepo.create({
      student_id: payload.studentId,
      parent_id: user.role === "parent" ? user.id : undefined,
      structure_id: payload.structureId || undefined,
      amount_due: amountDue,
      amount_paid: amountPaid,
      fine_amount: fineAmount,
      status,
      payment_method: payload.paymentMethod || "cash",
      payment_meta: payload.paymentMeta || null,
      created_by: user.id,
      note: payload.note || null,
    });

    if (payload.items && payload.items.length > 0) {
      for (const item of payload.items) {
        await feeTxItemRepo.create({
          transaction_id: tx.id,
          head: item.name || item.head,
          amount: Number(item.amount),
        });
      }
    }

    const { data: populatedTxData } = await feeTxRepo.findWithDetails({ id: tx.id });
    const populatedTx = populatedTxData[0];

    const formattedTx = {
      _id: populatedTx.id,
      studentId: populatedTx.student_id,
      parentId: populatedTx.parent_id,
      structureId: populatedTx.structure_id,
      amountDue: populatedTx.amount_due,
      amountPaid: populatedTx.amount_paid,
      fineAmount: populatedTx.fine_amount,
      status: populatedTx.status,
      paymentMethod: populatedTx.payment_method,
      paymentMeta: populatedTx.payment_meta,
      note: populatedTx.note,
      items: populatedTx.items.map((i: any) => ({ name: i.head, amount: i.amount })),
      createdAt: populatedTx.created_at,
      updatedAt: populatedTx.updated_at
    };

    return NextResponse.json({ success: true, transaction: formattedTx }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Invalid data" },
      { status: 400 }
    );
  }
}
