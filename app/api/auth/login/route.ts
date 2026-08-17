import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { UserRepository } from "@/repositories/user.repository";
import { TeacherRepository } from "@/repositories/teacher.repository";
import { StudentRepository } from "@/repositories/student.repository";
import { LogActivityRepository } from "@/repositories/logactivity.repository";
import { supabaseAdmin } from "@/lib/supabase";
import { getParentDisplayName } from "@/lib/parent";

export async function POST(req: Request) {
  try {
    const { email, password, role } = await req.json();
    console.log("[api/auth/login] Login attempt for email:", email, "role:", role);
    console.log("[api/auth/login] Password length received:", password ? password.length : "N/A");
    
    // Trim inputs
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    // Validate input
    if (!trimmedEmail || !trimmedPassword) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ["admin", "teacher", "student", "parent"];
    if (role && !validRoles.includes(role)) {
      return NextResponse.json(
        { error: "Invalid role provided" },
        { status: 400 }
      );
    }

    let user: any = null;
    let detectedRole = role || "admin";

    console.log(`[api/auth/login] Searching for user: ${trimmedEmail} with role hint: ${role}`);

    const userRepo = new UserRepository();
    const teacherRepo = new TeacherRepository();
    const studentRepo = new StudentRepository();

    // Search based on the role provided
    if (role === "teacher") {
      user = await teacherRepo.findByEmail(trimmedEmail);
      if (user) detectedRole = "teacher";
    } else if (role === "student" || role === "parent") {
      const students = await studentRepo.find({ email: trimmedEmail }, { limit: 1 });
      user = students.length > 0 ? students[0] : null;
      if (!user && role === "parent") {
        const { data: pMap } = await supabaseAdmin.from('student_parents').select('student_id').eq('email', trimmedEmail).limit(1).maybeSingle();
        if (pMap?.student_id) user = await studentRepo.findById(pMap.student_id);
      }
      if (user) detectedRole = role;
    } else if (role === "admin" || !role) {
      // Try User model first (admin/parent)
      user = await userRepo.findByEmail(trimmedEmail);
      if (user) detectedRole = user.role || "admin";
    }

    // Fallbacks
    if (!user) {
      console.log("[api/auth/login] User not found with primary role search, trying fallbacks...");
      user = await userRepo.findByEmail(trimmedEmail);
      if (user) detectedRole = user.role || "admin";
    }
    if (!user) {
      user = await teacherRepo.findByEmail(trimmedEmail);
      if (user) detectedRole = "teacher";
    }
    if (!user) {
      const students = await studentRepo.find({ email: trimmedEmail }, { limit: 1 });
      user = students.length > 0 ? students[0] : null;
      if (user) detectedRole = "student";
    }

    // Check if it's a parent email in student_parents
    if (!user) {
      const { data: parentMapping } = await supabaseAdmin
        .from('student_parents')
        .select('student_id')
        .eq('email', trimmedEmail)
        .limit(1)
        .maybeSingle();

      if (parentMapping?.student_id) {
        user = await studentRepo.findById(parentMapping.student_id);
        if (user) detectedRole = "parent";
      }
    }

    const logRepo = new LogActivityRepository();

    // If still not found in any model, return error
    if (!user) {
      console.log(`[api/auth/login] User not found: ${trimmedEmail}`);
      try {
        await logRepo.create({
          actor_email: trimmedEmail,
          actor_role: role || "unknown",
          action: "login",
          result: "failure",
          message: "Invalid email",
          ip: req.headers.get("x-forwarded-for") || undefined,
          user_agent: req.headers.get("user-agent") || undefined,
        });
      } catch (e) {
        console.error("Failed to save log activity (invalid email):", e);
      }
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    console.log(`[api/auth/login] User found: ${user.email} (${user.id}), Role: ${detectedRole}`);

    // Check if password field exists
    if (!user.password) {
      console.error("[api/auth/login] User has no password set");
      return NextResponse.json(
        { error: "User password not set" },
        { status: 400 }
      );
    }

    // Verify password
    console.log("[api/auth/login] Verifying password...");
    let match = false;
    try {
      match = await bcrypt.compare(trimmedPassword, user.password);
    } catch (err) {
      console.error("[api/auth/login] bcrypt error:", err);
    }

    console.log(`[api/auth/login] Password match result: ${match}`);

    if (!match) {
      try {
        await logRepo.create({
          actor_id: user.id,
          actor_email: user.email,
          actor_role: detectedRole,
          action: "login",
          result: "failure",
          message: "Invalid password",
          ip: req.headers.get("x-forwarded-for") || undefined,
          user_agent: req.headers.get("user-agent") || undefined,
        });
      } catch (e) {
        console.error("Failed to save log activity (invalid password):", e);
      }
      return NextResponse.json({ error: "Invalid password" }, { status: 400 });
    }

    // Ensure JWT_SECRET is defined
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error("[api/auth/login] JWT_SECRET is not defined");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const tokenPayload: Record<string, unknown> = { id: user.id, role: detectedRole, email: user.email };
    if (detectedRole === "parent") {
      tokenPayload.studentId = user.id; // student.id IS the child
    }
    const token = jwt.sign(tokenPayload, jwtSecret, {
      expiresIn: "7d",
    });

    const maxAge = 60 * 60 * 24 * 7; // 7 days

    let name = "";
    if (detectedRole === "parent") {
      name = await getParentDisplayName(user.id, trimmedEmail);
    }
    if (!name) {
      name = ("name" in user ? user.name : user.first_name) || "";
    }
    name = String(name).trim();
    if (name === "undefined" || name === "null") name = "";

    const nameParts = name ? name.split(/\s+/) : [];

    const res = NextResponse.json(
      {
        success: true,
        user: {
          _id: user.id,
          id: user.id,
          email: user.email,
          role: detectedRole,
          name: name,
          firstName: nameParts[0] || name || "",
          lastName: nameParts.slice(1).join(" ") || "",
        },
      },
      { status: 200 }
    );

    res.cookies.set("token", token, {
      httpOnly: true,
      path: "/",
      maxAge,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    const secureFlag = process.env.NODE_ENV === "production" ? "; Secure" : "";
    const cookieString = `token=${token}; Path=/; HttpOnly${secureFlag}; SameSite=Lax; Max-Age=${maxAge}`;
    res.headers.set("Set-Cookie", cookieString);

    try {
      await logRepo.create({
        actor_id: user.id,
        actor_email: user.email,
        actor_role: detectedRole,
        action: "login",
        result: "success",
        message: "Login successful",
        ip: req.headers.get("x-forwarded-for") || undefined,
        user_agent: req.headers.get("user-agent") || undefined,
      });
    } catch (e) {
      console.error("Failed to save log activity (success):", e);
    }

    return res;
  } catch (error) {
    console.error("[api/auth/login] Error:", error);
    return NextResponse.json(
      { error: "Internal server error during login" },
      { status: 500 }
    );
  }
}

