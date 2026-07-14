import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { FeeTransactionRepository, FeeTransactionItemRepository } from "@/repositories/fee.repository";
import { StudentRepository } from "@/repositories/student.repository";
import { TeacherRepository } from "@/repositories/teacher.repository";
import { UserRepository } from "@/repositories/user.repository";

export async function POST(req: NextRequest) {
    try {
        const token = req.cookies.get("token")?.value;
        const decoded = verifyToken(token);

        if (!decoded) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        let authUser: any = null;
        if (decoded.role === "teacher") {
            const teacherRepo = new TeacherRepository();
            authUser = await teacherRepo.findById(decoded.id);
            if (authUser) authUser.role = "teacher";
        } else {
            const userRepo = new UserRepository();
            authUser = await userRepo.findById(decoded.id);
        }

        if (!authUser || !["admin", "teacher"].includes(authUser.role)) {
            return NextResponse.json(
                { success: false, error: "Access denied. Admin or Teacher only." },
                { status: 403 }
            );
        }

        const { studentId, items, dueDate, note } = await req.json();

        if (!studentId || !items || items.length === 0) {
            return NextResponse.json(
                { success: false, error: "Missing required fields" },
                { status: 400 }
            );
        }

        const studentRepo = new StudentRepository();
        const student = await studentRepo.findById(studentId);
        if (!student) {
            return NextResponse.json(
                { success: false, error: "Student not found" },
                { status: 404 }
            );
        }

        const amountDue = items.reduce((sum: number, item: any) => sum + Number(item.amount), 0);

        const feeTxRepo = new FeeTransactionRepository();
        const feeTxItemRepo = new FeeTransactionItemRepository();

        const newTransaction = await feeTxRepo.create({
            student_id: student.id,
            amount_due: amountDue,
            amount_paid: 0,
            fine_amount: 0,
            status: "due",
            due_date: dueDate ? new Date(dueDate) : undefined,
            note,
            created_by: authUser.id,
        });

        const createdItems = [];
        for (const item of items) {
            const createdItem = await feeTxItemRepo.create({
                transaction_id: newTransaction.id,
                head: item.head || item.name, // Support existing payload format
                amount: Number(item.amount),
            });
            createdItems.push(createdItem);
        }

        const { data: populatedData } = await feeTxRepo.findWithDetails({ id: newTransaction.id });
        const tx = populatedData[0];

        const formattedTransaction = {
            _id: tx.id,
            studentId: tx.student_id,
            amountDue: tx.amount_due,
            amountPaid: tx.amount_paid,
            fineAmount: tx.fine_amount,
            status: tx.status,
            items: tx.items.map((i: any) => ({ name: i.head, amount: i.amount })),
            dueDate: tx.due_date,
            note: tx.note,
            createdAt: tx.created_at,
            updatedAt: tx.updated_at
        };

        return NextResponse.json({
            success: true,
            transaction: formattedTransaction,
        });

    } catch (error: any) {
        console.error("Error creating fee transaction:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Failed to create fee transaction" },
            { status: 500 }
        );
    }
}
