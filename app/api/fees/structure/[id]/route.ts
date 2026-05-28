import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import FeeStructure from "@/models/FeeStructure";
import { verifyToken } from "@/lib/auth";
import { FeeStructureCreateZ } from "@/lib/validations/feeSchema";

export async function GET(req: Request, { params }: any) {
  await connectDB();
  const item = await FeeStructure.findById(params.id).lean();
  if (!item) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true, item });
}

export async function PUT(req: Request, { params }: any) {
  await connectDB();
  const token = req.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];
  const user = verifyToken(token);
  if (!user || user.role !== "admin") return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });

  try {
    const body = await req.json();
    const parsed = FeeStructureCreateZ.partial().parse(body);
    const updated = await FeeStructure.findByIdAndUpdate(params.id, parsed, { new: true });
    return NextResponse.json({ success: true, item: updated });
  } catch (err:any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}

export async function DELETE(req: Request, { params }: any) {
  await connectDB();
  const token = req.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];
  const user = verifyToken(token);
  if (!user || user.role !== "admin") return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });

  const deleted = await FeeStructure.findByIdAndDelete(params.id);
  if (!deleted) return NextResponse.json({ success:false, error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true, deletedId: params.id });
}
