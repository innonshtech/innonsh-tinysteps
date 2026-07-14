import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { FeeStructureCreateZ } from "@/lib/validations/feeSchema";
import { FeeStructureRepository, FeeStructureHeadRepository } from "@/repositories/fee.repository";

export async function GET(req: Request, { params }: any) {
  const { id } = await params;
  const structRepo = new FeeStructureRepository();
  const structures = await structRepo.findWithHeads({ id });
  
  if (structures.length === 0) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  }

  const structure = structures[0];
  const item = {
    _id: structure.id,
    id: structure.id,
    name: structure.name,
    classId: structure.class_id,
    finePerDay: structure.fine_per_day,
    description: structure.description,
    active: structure.active,
    heads: structure.heads?.map((h: any) => ({
      _id: h.id,
      title: h.title,
      amount: h.amount,
      frequency: h.frequency,
      dueDateDay: h.due_date_day
    })) || [],
    createdAt: structure.created_at,
    updatedAt: structure.updated_at
  };

  return NextResponse.json({ success: true, item });
}

export async function PUT(req: Request, { params }: any) {
  const token = req.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];
  const user = verifyToken(token);
  if (!user || user.role !== "admin") return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });

  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = FeeStructureCreateZ.partial().parse(body);
    
    const structRepo = new FeeStructureRepository();
    const headRepo = new FeeStructureHeadRepository();

    const updateData: any = {};
    if (parsed.name) updateData.name = parsed.name;
    if (parsed.classId) updateData.class_id = parsed.classId;
    if (parsed.finePerDay !== undefined) updateData.fine_per_day = parsed.finePerDay;
    if (parsed.description !== undefined) updateData.description = parsed.description;

    const updated = await structRepo.update(id, updateData);

    if (parsed.heads) {
        // Delete old heads
        const oldStructures = await structRepo.findWithHeads({ id });
        if (oldStructures.length > 0 && oldStructures[0].heads) {
            for (const h of oldStructures[0].heads) {
                await headRepo.delete(h.id);
            }
        }
        
        // Add new heads
        for (const head of parsed.heads) {
            await headRepo.create({
                fee_structure_id: id,
                title: head.title,
                amount: head.amount,
                frequency: head.frequency || 'monthly',
                due_date_day: head.dueDateDay || 1
            });
        }
    }
    
    // Fetch newly updated with heads to return
    const newStructures = await structRepo.findWithHeads({ id });
    const newStruct = newStructures[0];
    
    const item = {
      _id: newStruct.id,
      id: newStruct.id,
      name: newStruct.name,
      classId: newStruct.class_id,
      finePerDay: newStruct.fine_per_day,
      description: newStruct.description,
      active: newStruct.active,
      heads: newStruct.heads?.map((h: any) => ({
        _id: h.id,
        title: h.title,
        amount: h.amount,
        frequency: h.frequency,
        dueDateDay: h.due_date_day
      })) || [],
      createdAt: newStruct.created_at,
      updatedAt: newStruct.updated_at
    };

    return NextResponse.json({ success: true, item });
  } catch (err:any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}

export async function DELETE(req: Request, { params }: any) {
  const token = req.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];
  const user = verifyToken(token);
  if (!user || user.role !== "admin") return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });

  const { id } = await params;
  const structRepo = new FeeStructureRepository();
  
  try {
      await structRepo.delete(id);
      return NextResponse.json({ success: true, deletedId: id });
  } catch(error) {
      return NextResponse.json({ success:false, error: "Not found or delete failed" }, { status: 404 });
  }
}
