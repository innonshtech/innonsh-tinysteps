import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import FeeStructure from "@/models/FeeStructure";
import { verifyToken } from "@/lib/auth";
import { FeeStructureCreateZ } from "@/lib/validations/feeSchema";
import { logAdminActivity } from "@/lib/logAdminActivity";

// GET single fee structure
export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    await connectDB();

    const token = req.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];
    const user = verifyToken(token);
    if (!user || !["admin", "finance", "teacher"].includes(user.role)) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    try {
        const { id } = await params;
        const feeStructure = await FeeStructure.findById(id);
        if (!feeStructure) {
            return NextResponse.json({ success: false, error: "Fee structure not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, item: feeStructure });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 400 });
    }
}

// PUT (update) fee structure
export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    await connectDB();

    const token = req.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];
    const user = verifyToken(token);
    if (!user || user.role !== "admin") {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    try {
        const { id } = await params;
        const body = await req.json();
        const parsed = FeeStructureCreateZ.parse(body);

        const updated = await FeeStructure.findByIdAndUpdate(
            id,
            parsed,
            { new: true, runValidators: true }
        );

        if (!updated) {
            return NextResponse.json({ success: false, error: "Fee structure not found" }, { status: 404 });
        }

        // Log admin activity
        await logAdminActivity({
            actorId: String(user.id),
            actorRole: user.role,
            action: "update:fee",
            message: `Fee structure updated: ${updated.name}`,
            metadata: {
                feeId: updated._id,
                name: updated.name,
            },
        });

        return NextResponse.json({ success: true, item: updated });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 400 });
    }
}

// DELETE fee structure
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    await connectDB();

    const token = req.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];
    const user = verifyToken(token);
    if (!user || user.role !== "admin") {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    try {
        const { id } = await params;
        const deleted = await FeeStructure.findByIdAndDelete(id);

        if (!deleted) {
            return NextResponse.json({ success: false, error: "Fee structure not found" }, { status: 404 });
        }

        // Log admin activity
        await logAdminActivity({
            actorId: String(user.id),
            actorRole: user.role,
            action: "delete:fee",
            message: `Fee structure deleted: ${deleted.name}`,
            metadata: {
                feeId: deleted._id,
                name: deleted.name,
            },
        });

        return NextResponse.json({ success: true, message: "Fee structure deleted successfully" });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 400 });
    }
}
