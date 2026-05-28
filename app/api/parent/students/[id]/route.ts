import { NextResponse, NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import Student from "@/models/Student";
import { verifyToken } from "@/lib/auth";

// 🔥 FIX: Student Type
interface IStudent {
  _id: string;
  parents?: { parentId: string }[];
  [key: string]: any;
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  await connectDB();

  const { id } = await context.params;

  const token = req.cookies.get("token")?.value;
  const user = verifyToken(token);

  if (!user || user.role !== "parent") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }

  // 🔥 FIX: Lean document typed correctly
  const student =
    (await Student.findById(id).lean<IStudent>()) as IStudent | null;

  if (!student) {
    return NextResponse.json({ success: false, error: "Student not found" }, { status: 404 });
  }

  // 🔥 FIX: parents property now properly recognized
  const isParent = (student.parents || []).some(
    (p) => String(p.parentId) === String(user.id)
  );

  if (!isParent) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ success: true, student });
}
  