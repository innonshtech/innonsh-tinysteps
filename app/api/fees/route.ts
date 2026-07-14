import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { FeeStructureCreateZ } from "@/lib/validations/feeSchema";
import { LogActivityRepository } from "@/repositories/logactivity.repository";
import { FeeStructureRepository, FeeStructureHeadRepository } from "@/repositories/fee.repository";

export async function GET(req: Request) {
  const token = req.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];
  const user = verifyToken(token);
  if (!user || !["admin", "finance", "teacher"].includes(user.role)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }

  const url = new URL(req.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
  const limit = Math.max(1, Math.min(100, parseInt(url.searchParams.get("limit") || "20")));
  const skip = (page - 1) * limit;

  const repo = new FeeStructureRepository();
  const itemsData = await repo.findWithHeads({}, { skip, limit });
  
  // Need exact count, use separate count call
  const total = await repo.count({});

  // Map to frontend expected format
  const items = itemsData.map((i: any) => ({
    _id: i.id,
    id: i.id,
    name: i.name,
    classId: i.class ? { _id: i.class.id, name: i.class.name, section: i.class.section } : i.class_id,
    finePerDay: i.fine_per_day,
    description: i.description,
    active: i.active,
    heads: i.heads ? i.heads.map((h: any) => ({
      _id: h.id,
      title: h.title,
      amount: h.amount,
      frequency: h.frequency,
      dueDateDay: h.due_date_day
    })) : [],
    createdAt: i.created_at,
    updatedAt: i.updated_at
  }));

  return NextResponse.json({ success: true, items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
}

export async function POST(req: Request) {
  const token = req.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];
  const user = verifyToken(token);
  if (!user || user.role !== "admin") return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });

  try {
    const body = await req.json();
    const parsed = FeeStructureCreateZ.parse(body);
    
    const structRepo = new FeeStructureRepository();
    const headRepo = new FeeStructureHeadRepository();
    
    // Create the structure first
    const createdStruct = await structRepo.create({
      name: parsed.name,
      class_id: parsed.classId,
      fine_per_day: parsed.finePerDay || 0,
      description: parsed.description,
      active: true,
    });

    // Create the associated heads
    const headsData = [];
    if (parsed.heads && parsed.heads.length > 0) {
      for (const head of parsed.heads) {
        const createdHead = await headRepo.create({
          fee_structure_id: createdStruct.id,
          title: head.title,
          amount: head.amount,
          frequency: head.frequency || 'monthly',
          due_date_day: head.dueDateDay || 1,
        });
        headsData.push(createdHead);
      }
    }

    const created = {
      ...createdStruct,
      _id: createdStruct.id,
      classId: createdStruct.class_id,
      finePerDay: createdStruct.fine_per_day,
      heads: headsData.map(h => ({
        _id: h.id,
        title: h.title,
        amount: h.amount,
        frequency: h.frequency,
        dueDateDay: h.due_date_day
      }))
    };

    // Log admin activity
    const logRepo = new LogActivityRepository();
    await logRepo.create({
      actor_id: String(user.id),
      actor_role: user.role,
      action: "create:fee",
      message: `Fee structure created: ${created.name}`,
      result: 'success',
      metadata: {
        feeId: created._id,
        name: created.name,
      },
    });

    return NextResponse.json({ success: true, item: created }, { status: 201 });
  } catch (err: any) {
    const details = err?.issues ?? err?.errors ?? undefined;
    return NextResponse.json(
      { success: false, error: err.message, ...(details ? { details } : {}) },
      { status: 400 }
    );
  }
}
