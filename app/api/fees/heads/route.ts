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

export async function GET(req: NextRequest) {
    try {
        const user = await checkAuth(req);
        if (!user) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const repo = new FeeHeadRepository();
        const headsData = await repo.find({}, { sort: { field: "created_at", ascending: false }});
        
        const heads = headsData.filter(h => h.active).map(h => ({
          _id: h.id,
          id: h.id,
          name: h.name,
          type: h.type,
          defaultAmount: h.default_amount,
          description: h.description,
          active: h.active,
          createdAt: h.created_at,
          updatedAt: h.updated_at
        }));

        return NextResponse.json({ success: true, heads });
    } catch (error: any) {
        console.error("Fetch fee heads error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const user = await checkAuth(req);
        if (!user) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { name, type, defaultAmount, description } = body;

        if (!name) {
            return NextResponse.json({ success: false, error: "Name is required" }, { status: 400 });
        }

        const repo = new FeeHeadRepository();
        const existing = await repo.findOne({ name });
        if (existing) {
            return NextResponse.json({ success: false, error: "Fee Head with this name already exists" }, { status: 400 });
        }

        const created = await repo.create({
            name,
            type,
            default_amount: Number(defaultAmount) || 0,
            description,
            active: true
        });

        const newHead = {
          _id: created.id,
          id: created.id,
          name: created.name,
          type: created.type,
          defaultAmount: created.default_amount,
          description: created.description,
          active: created.active,
          createdAt: created.created_at,
          updatedAt: created.updated_at
        };

        return NextResponse.json({ success: true, head: newHead });
    } catch (error: any) {
        console.error("Create fee head error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
