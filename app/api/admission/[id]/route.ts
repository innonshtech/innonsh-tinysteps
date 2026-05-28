// app/api/admission/[id]/route.ts

import { NextResponse, NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import Admission from "@/models/Admission";
import { verifyToken } from "@/lib/auth";

// ----- Define correct Admission lean type for TypeScript -----
interface IAdmission {
  _id: string;
  appliedByParentId?: string;
  parents?: { parentId: string }[];
  status?: string;
  dob?: Date | string;
  [key: string]: any; // fallback for unknown fields
}


// ====================== GET ======================
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  await connectDB();
  const { id } = await context.params;

  const admission = (await Admission.findById(id).lean()) as IAdmission | null;

  if (!admission)
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

  const token = req.cookies.get("token")?.value;
  const user = verifyToken(token);

  if (user?.role === "admin") {
    return NextResponse.json({ success: true, admission });
  }

  if (user?.role === "parent") {
    const allowed =
      String(admission.appliedByParentId) === String(user.id) ||
      (admission.parents || []).some(
        (p) => String(p.parentId) === String(user.id)
      );

    if (!allowed)
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

    return NextResponse.json({ success: true, admission });
  }

  return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
}



// ====================== PUT ======================
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  await connectDB();
  const { id } = await context.params;

  const token = req.cookies.get("token")?.value;
  const user = verifyToken(token);

  const admission = (await Admission.findById(id)) as any;

  if (!admission)
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

  // Parent can modify only if they applied
  if (user?.role === "parent") {
    if (String(admission.appliedByParentId) !== String(user.id)) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    if (!["submitted", "pending"].includes(admission.status)) {
      return NextResponse.json({ success: false, error: "Cannot modify" }, { status: 400 });
    }
  } 
  // Non-admins blocked
  else if (user?.role !== "admin") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await req.json();

    if (body.dob) body.dob = new Date(body.dob);

    Object.assign(admission, body);
    await admission.save();

    return NextResponse.json({ success: true, admission });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Update failed" },
      { status: 400 }
    );
  }
}



// ====================== DELETE ======================
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  await connectDB();
  const { id } = await context.params;

  const token = req.cookies.get("token")?.value;
  const user = verifyToken(token);

  if (!user || user.role !== "admin") {
    return NextResponse.json(
      { success: false, error: "Only admin may delete" },
      { status: 403 }
    );
  }

  const deleted = await Admission.findByIdAndDelete(id);

  if (!deleted)
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

  return NextResponse.json({ success: true, deletedId: id });
}
