import { NextResponse, NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth";
import { parentOwnsStudent } from "@/lib/parent";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const token = req.cookies.get("token")?.value;
  const user = verifyToken(token);

  if (!user || user.role !== "parent") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }

  const student = await parentOwnsStudent(id, user.id, (user as any).email);

  if (!student) {
    return NextResponse.json({ success: false, error: "Student not found or Forbidden" }, { status: 404 });
  }

  return NextResponse.json({ success: true, student });
}
  