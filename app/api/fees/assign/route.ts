import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { FeeStructureRepository, FeeTransactionRepository, FeeTransactionItemRepository } from "@/repositories/fee.repository";
import { StudentRepository } from "@/repositories/student.repository";
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

export async function POST(req: NextRequest) {
    try {
        const authUser = await checkAuth(req);
        if (!authUser) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { structureId, classId, month, year, dueDate } = body;

        if (!structureId || !classId) {
            return NextResponse.json({ success: false, error: "Structure and Class are required" }, { status: 400 });
        }

        // 1. Fetch Structure
        const structRepo = new FeeStructureRepository();
        const structures = await structRepo.findWithHeads({ id: structureId });
        const structure = structures.length > 0 ? structures[0] : null;

        if (!structure) {
            return NextResponse.json({ success: false, error: "Fee Structure not found" }, { status: 404 });
        }

        // 2. Fetch Students by classId
        const studentRepo = new StudentRepository();
        const { data: students } = await studentRepo.findWithRelations({ class_id: classId });
        const activeStudents = students.filter(s => s.status !== 'inactive'); // Assuming status logic
        
        if (activeStudents.length === 0) {
            return NextResponse.json({ success: false, error: "No active students found in this class" }, { status: 404 });
        }

        // 3. Prepare Transaction Details
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

        let title = structure.name;
        if (month !== undefined && year) {
            title = `${structure.name} - ${monthNames[parseInt(month)]} ${year}`;
        }

        const totalAmount = structure.heads?.reduce((sum: number, head: any) => sum + Number(head.amount), 0) || 0;

        const items = structure.heads?.map((head: any) => ({
            head: head.title,
            amount: head.amount,
        })) || [];

        const finalDueDate = dueDate ? new Date(dueDate) : new Date();

        const feeTxRepo = new FeeTransactionRepository();
        const feeTxItemRepo = new FeeTransactionItemRepository();

        for (const student of activeStudents) {
            const tx = await feeTxRepo.create({
                student_id: student.id,
                structure_id: structure.id,
                amount_due: totalAmount,
                amount_paid: 0,
                fine_amount: 0,
                status: "due",
                due_date: finalDueDate,
                note: title,
                created_by: authUser.id,
            });

            for (const item of items) {
                await feeTxItemRepo.create({
                    transaction_id: tx.id,
                    head: item.head,
                    amount: item.amount,
                });
            }
        }

        return NextResponse.json({
            success: true,
            message: `Successfully generated fees for ${activeStudents.length} students.`,
            count: activeStudents.length
        });

    } catch (error: any) {
        console.error("Bulk assign error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
