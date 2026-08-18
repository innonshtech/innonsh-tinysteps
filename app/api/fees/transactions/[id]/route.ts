import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { FeeTransactionRepository, FeeTransactionItemRepository } from "@/repositories/fee.repository";
import { TeacherRepository } from "@/repositories/teacher.repository";
import { UserRepository } from "@/repositories/user.repository";

// Helper to check authorized access (admin or teacher)
async function checkAuth(req: NextRequest) {
    const token = req.cookies.get("token")?.value;
    const decoded = verifyToken(token);
    if (!decoded) return null;

    let user: any = null;
    if (decoded.role === "teacher") {
        const teacherRepo = new TeacherRepository();
        user = await teacherRepo.findById(decoded.id);
        if (user) user.role = "teacher";
    } else {
        const userRepo = new UserRepository();
        user = await userRepo.findById(decoded.id);
    }

    if (!user || !["admin", "teacher"].includes(user.role)) return null;

    return user;
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await checkAuth(req);
        if (!user) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const feeTxRepo = new FeeTransactionRepository();
        const transaction = await feeTxRepo.findById(id);

        if (!transaction) {
            return NextResponse.json({ success: false, error: "Transaction not found" }, { status: 404 });
        }

        if (transaction.amount_paid > 0) {
            return NextResponse.json(
                { success: false, error: "Cannot delete a transaction that has collected payments. Please delete/refund payments first mainly by database access for now." },
                { status: 400 }
            );
        }

        await feeTxRepo.delete(id);

        return NextResponse.json({ success: true, message: "Transaction deleted successfully" });
    } catch (error: any) {
        console.error("Delete transaction error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await checkAuth(req);
        if (!user) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();
        const { note, dueDate, items } = body;

        const feeTxRepo = new FeeTransactionRepository();
        const feeTxItemRepo = new FeeTransactionItemRepository();
        const transaction = await feeTxRepo.findById(id);
        
        if (!transaction) {
            return NextResponse.json({ success: false, error: "Transaction not found" }, { status: 404 });
        }

        const updateData: any = {};
        if (note !== undefined) updateData.note = note;
        if (dueDate !== undefined) updateData.due_date = new Date(dueDate);

        if (items && items.length > 0) {
            if (transaction.amount_paid > 0) {
                return NextResponse.json(
                    { success: false, error: "Cannot update fee items/amount when partial payment exists." },
                    { status: 400 }
                );
            } else {
                updateData.amount_due = items.reduce((sum: number, item: any) => sum + Number(item.amount), 0);
                
                // Fetch and delete existing items
                const { data: existingItemsData } = await feeTxRepo.findWithDetails({ id: transaction.id });
                if (existingItemsData.length > 0) {
                   const existingItems = existingItemsData[0].items || [];
                   for(const exItem of existingItems) {
                       await feeTxItemRepo.delete(exItem.id);
                   }
                }
                
                // Insert new items
                for (const item of items) {
                    await feeTxItemRepo.create({
                        transaction_id: transaction.id,
                        head: item.head || item.name,
                        amount: Number(item.amount),
                    });
                }
            }
        }

        const updated = await feeTxRepo.update(id, updateData);

        return NextResponse.json({ success: true, transaction: updated });
    } catch (error: any) {
        console.error("Update transaction error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
