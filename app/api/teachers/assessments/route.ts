import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Assessment from "@/models/Assessment";
import { AssessmentCreateZ } from "@/lib/validations/teacherSchema";
import { verifyToken } from "@/lib/auth";

export async function POST(req: Request) {
  await connectDB();
  const cookie = req.headers.get("cookie") || "";
  const token = cookie.match(/token=([^;]+)/)?.[1];
  const user = verifyToken(token);

  if (!user || !["teacher", "admin"].includes(user.role)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = AssessmentCreateZ.parse(body);

    const created = await Assessment.create({
      ...parsed,
      teacherId: user.id,
    });

    return NextResponse.json({ success: true, assessment: created }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || "Invalid" }, { status: 400 });
  }
}
