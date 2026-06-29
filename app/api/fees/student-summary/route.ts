import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { FeeTransactionRepository } from "@/repositories/fee.repository";
import { StudentRepository } from "@/repositories/student.repository";
import { TeacherRepository } from "@/repositories/teacher.repository";
import { UserRepository } from "@/repositories/user.repository";

export async function GET(req: NextRequest) {
    try {
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
            const teacherRepo = new TeacherRepository();
            user = await teacherRepo.findById(decoded.id);
            if (user) user.role = "teacher";
        } else {
            const userRepo = new UserRepository();
            user = await userRepo.findById(decoded.id);
        }

        if (!user || !["admin", "teacher"].includes(user.role)) {
            return NextResponse.json(
                { success: false, error: "Access denied. Admin or Teacher only." },
                { status: 403 }
            );
        }

        const studentRepo = new StudentRepository();
        const { data: students } = await studentRepo.findWithRelations();

        const feeTxRepo = new FeeTransactionRepository();
        const { data: allTransactions } = await feeTxRepo.findWithDetails();

        const studentFeeData = students.map((student: any) => {
            const transactions = allTransactions.filter(
                (t: any) => t.student_id === student.id
            );

            const totalDue = transactions.reduce((sum: number, t: any) => sum + (t.amount_due || 0), 0);
            const totalPaid = transactions.reduce((sum: number, t: any) => sum + (t.amount_paid || 0), 0);
            const totalFine = transactions.reduce((sum: number, t: any) => sum + (t.fine_amount || 0), 0);
            const totalPending = totalDue - totalPaid;

            let status: "paid" | "partial" | "due" = "due";
            if (totalPending === 0 && totalDue > 0) {
                status = "paid";
            } else if (totalPaid > 0 && totalPending > 0) {
                status = "partial";
            }

            return {
                student: {
                    _id: student.id,
                    firstName: student.first_name,
                    lastName: student.last_name,
                    email: student.email,
                    admissionNo: student.admission_no,
                    classId: student.class ? {
                       _id: student.class.id,
                       name: student.class.name,
                       section: student.class.section,
                       teachers: student.class.teachers
                    } : student.class_id,
                    dob: student.dob,
                    gender: student.gender,
                    parents: student.parents,
                    medical: { allergies: student.medical_allergies, notes: student.medical_notes },
                    photo: student.photo,
                },
                totalDue,
                totalPaid,
                totalPending,
                totalFine,
                transactions: transactions.map((t: any) => ({
                    _id: t.id,
                    studentId: t.student_id,
                    amountDue: t.amount_due,
                    amountPaid: t.amount_paid,
                    fineAmount: t.fine_amount,
                    status: t.status,
                    items: t.items.map((i: any) => ({ name: i.head, amount: i.amount })),
                    dueDate: t.due_date,
                    note: t.note || "",
                    createdAt: t.created_at,
                    updatedAt: t.updated_at,
                })),
                status,
            };
        });

        return NextResponse.json({
            success: true,
            students: studentFeeData,
        });
    } catch (error: any) {
        console.error("Error fetching student fee summary:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Failed to fetch student fee summary" },
            { status: 500 }
        );
    }
}
