import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { FeeStructureCreateZ } from "@/lib/validations/feeSchema";
import { FeeStructureRepository } from "@/repositories/fee.repository";
import { LogActivityRepository } from "@/repositories/logactivity.repository";

// GET single fee structure
export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const token = req.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];
    const user = verifyToken(token);
    if (!user || !["admin", "finance", "teacher"].includes(user.role)) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    try {
        const { id } = await params;
        const repo = new FeeStructureRepository();
        const feeStructure = await repo.findById(id);
        
        if (!feeStructure) {
            return NextResponse.json({ success: false, error: "Fee structure not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, item: { ...feeStructure, _id: feeStructure.id } });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 400 });
    }
}

// PUT (update) fee structure
export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const token = req.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];
    const user = verifyToken(token);
    if (!user || user.role !== "admin") {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    try {
        const { id } = await params;
        const body = await req.json();
        const parsed = FeeStructureCreateZ.parse(body);

        const repo = new FeeStructureRepository();
        
        // Find existing to make sure it exists
        const existing = await repo.findById(id);
        if (!existing) {
            return NextResponse.json({ success: false, error: "Fee structure not found" }, { status: 404 });
        }
        
        const updated = await repo.update(id, {
            name: parsed.name,
            class_id: parsed.classId,
            fine_per_day: parsed.finePerDay || 0,
            description: parsed.description,
            active: parsed.active ?? true,
        });

        // We aren't doing full nested heads update here because there is a separate route 
        // for heads or they update heads separately in the original logic anyway (or the 
        // original logic just updated the main document if heads weren't strictly handled).

        // Log admin activity
        const logRepo = new LogActivityRepository();
        await logRepo.create({
            actor_id: String(user.id),
            actor_role: user.role,
            action: "update:fee",
            message: `Fee structure updated: ${updated?.name}`,
            result: 'success',
            metadata: {
                feeId: updated?.id,
                name: updated?.name,
            },
        });

        return NextResponse.json({ success: true, item: { ...updated, _id: updated?.id } });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 400 });
    }
}

// DELETE fee structure
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const token = req.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];
    const user = verifyToken(token);
    if (!user || user.role !== "admin") {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    try {
        const { id } = await params;
        const repo = new FeeStructureRepository();
        
        const existing = await repo.findById(id);
        if (!existing) {
            return NextResponse.json({ success: false, error: "Fee structure not found" }, { status: 404 });
        }

        await repo.delete(id);

        // Log admin activity
        const logRepo = new LogActivityRepository();
        await logRepo.create({
            actor_id: String(user.id),
            actor_role: user.role,
            action: "delete:fee",
            message: `Fee structure deleted: ${existing.name}`,
            result: 'success',
            metadata: {
                feeId: existing.id,
                name: existing.name,
            },
        });

        return NextResponse.json({ success: true, message: "Fee structure deleted successfully" });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 400 });
    }
}
