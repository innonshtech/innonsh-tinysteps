import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { FeeHeadRepository } from "@/repositories/fee.repository";
import { TeacherRepository } from "@/repositories/teacher.repository";
import { UserRepository } from "@/repositories/user.repository";

// Helper to check authorized access (admin or teacher)
async function checkAuth(req: NextRequest) {
    const token = req.cookies.get("token")?.value;
    const decoded = verifyToken(token);
    if (!decoded) return null;

    let user: any = null;
    if (decoded.role === "teacher") {
        const repo = new TeacherRepository();
        user = await repo.findById(decoded.id);
        if (user) user.role = "teacher";
    } else {
        const repo = new UserRepository();
        user = await repo.findById(decoded.id);
    }

    if (!user || !["admin", "teacher"].includes(user.role)) return null;

    return user;
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
        const { name, type, defaultAmount, description } = body;

        const repo = new FeeHeadRepository();
        const head = await repo.findById(id);
        
        if (!head) {
            return NextResponse.json({ success: false, error: "Fee Head not found" }, { status: 404 });
        }

        const updateData: any = {};
        if (name) updateData.name = name;
        if (type) updateData.type = type;
        if (defaultAmount !== undefined) updateData.default_amount = Number(defaultAmount);
        if (description !== undefined) updateData.description = description;

        const updated = await repo.update(id, updateData);

        return NextResponse.json({ success: true, head: updated });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
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

        const repo = new FeeHeadRepository();
        
        // Soft delete
        const head = await repo.update(id, { active: false });

        if (!head) {
            return NextResponse.json({ success: false, error: "Fee Head not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: "Fee Head deactivated" });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
