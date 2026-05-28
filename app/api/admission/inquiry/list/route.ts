// app/api/admission/inquiry/list/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Inquiry from "@/models/Inquiry";
import { verifyToken } from "@/lib/auth";

export async function GET(req: Request) {
  await connectDB();
  const token = req.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];
  const user = verifyToken(token);
  if (!user || user.role !== "admin") return NextResponse.json({ success:false, error:"Unauthorized" }, { status:403 });

  const inquiries = await Inquiry.find().sort({ createdAt: -1 }).lean();
  return NextResponse.json({ success: true, inquiries });
}
