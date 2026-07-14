import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { UserRepository } from "@/repositories/user.repository";
import { LogActivityRepository } from "@/repositories/logactivity.repository";

export async function POST(req: Request) {
  const body = await req.json();

  const hashed = await bcrypt.hash(body.password, 10);

  const repo = new UserRepository();
  const user = await repo.create({
    name: body.name,
    email: body.email,
    password: hashed,
    role: body.role || "admin"
  });

  try {
    const logRepo = new LogActivityRepository();
    await logRepo.create({
      actor_id: user.id,
      actor_role: user.role || "admin",
      action: "register",
      result: "success",
      message: "User registration successful",
      metadata: {
        email: user.email,
        ip: req.headers.get("x-forwarded-for") || undefined,
        userAgent: req.headers.get("user-agent") || undefined,
      }
    });
  } catch (e) {
    console.error("Failed to save log activity (register):", e);
  }

  return NextResponse.json({ success: true, user: { ...user, _id: user.id } });
}
