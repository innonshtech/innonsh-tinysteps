import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import FeeTransaction from "@/models/FeeTransaction";
import { verifyToken } from "@/lib/auth";

export async function GET(req: Request) {
  await connectDB();
  const token = req.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];
  const user = verifyToken(token);
  if (!user || !["admin","finance","teacher"].includes(user.role)) return NextResponse.json({ success:false, error:"Unauthorized" }, { status:403 });

  const url = new URL(req.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
  const limit = Math.max(1, Math.min(100, parseInt(url.searchParams.get("limit") || "20")));
  const skip = (page - 1) * limit;

  const filter: any = {};
  if (url.searchParams.get("studentId")) filter.studentId = url.searchParams.get("studentId");
  if (url.searchParams.get("status")) filter.status = url.searchParams.get("status");

  const [items, total] = await Promise.all([
    FeeTransaction.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    FeeTransaction.countDocuments(filter)
  ]);

  return NextResponse.json({ success: true, items, pagination: { page, limit, total, pages: Math.ceil(total/limit) }});
}
