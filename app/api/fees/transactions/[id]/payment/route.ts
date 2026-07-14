import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { FeeTransactionRepository } from "@/repositories/fee.repository";
import { TeacherRepository } from "@/repositories/teacher.repository";
import { UserRepository } from "@/repositories/user.repository";

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> } // Fix for Next.js 15: params is a Promise
) {
    try {
        // Verify authentication
        const token = req.cookies.get("token")?.value;
        const decoded = verifyToken(token);

        if (!decoded) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        let user: any = null;
        if (decoded.role === "teacher") {
            const repo = new TeacherRepository();
            user = await repo.findById(decoded.id);
            if (user) user.role = "teacher";
        } else {
            const repo = new UserRepository();
            user = await repo.findById(decoded.id);
        }

        if (!user || !["admin", "teacher"].includes(user.role)) {
            return NextResponse.json(
                { success: false, error: "Access denied. Admin or Teacher only." },
                { status: 403 }
            );
        }

        const { id: transactionId } = await params;
        const body = await req.json();
        const { amountPaid, paymentMethod, paymentDate, note, fineAdjustment } = body;

        if (!amountPaid || amountPaid <= 0) {
            return NextResponse.json(
                { success: false, error: "Invalid payment amount" },
                { status: 400 }
            );
        }

        const repo = new FeeTransactionRepository();
        const transaction = await repo.findById(transactionId);

        if (!transaction) {
            return NextResponse.json(
                { success: false, error: "Transaction not found" },
                { status: 404 }
            );
        }

        const currentPaid = transaction.amount_paid || 0;
        const remainingBalance = (transaction.amount_due + (transaction.fine_amount || 0)) - currentPaid;

        // Cap payment to the remaining balance — no overpayment allowed
        const effectivePayment = Math.min(amountPaid, Math.max(remainingBalance, 0));
        const newTotalPaid = currentPaid + effectivePayment;
        const totalDue = transaction.amount_due + (transaction.fine_amount || 0);

        // Determine status
        let newStatus = transaction.status;
        if (newTotalPaid >= totalDue) {
            newStatus = "paid";
        } else if (newTotalPaid > 0) {
            newStatus = "partial";
        } else {
            newStatus = "due";
        }

        const updated = await repo.update(transactionId, {
            amount_paid: newTotalPaid,
            status: newStatus
        });

        return NextResponse.json({
            success: true,
            transaction: updated,
        });

    } catch (error: any) {
        console.error("Error recording payment:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Failed to record payment" },
            { status: 500 }
        );
    }
}
