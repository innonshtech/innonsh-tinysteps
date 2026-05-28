import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import LogActivity from "@/models/LogActivity";

export async function POST(req: Request) {
  await connectDB();
  const body = await req.json();

  const hashed = await bcrypt.hash(body.password, 10);

  const user = await User.create({
    name: body.name,
    email: body.email,
    password: hashed,
    role: body.role || "admin"
  });

  try {
    await LogActivity.create({
      actorId: user._id,
      actorEmail: user.email,
      actorRole: user.role || "admin",
      action: "register",
      result: "success",
      message: "User registration successful",
      ip: req.headers.get("x-forwarded-for") || undefined,
      userAgent: req.headers.get("user-agent") || undefined,
    });
  } catch (e) {
    console.error("Failed to save log activity (register):", e);
  }

  return NextResponse.json({ success: true, user });
}
