import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { UserRepository } from "@/repositories/user.repository";
import { TeacherRepository } from "@/repositories/teacher.repository";
import { StudentRepository } from "@/repositories/student.repository";
import { getParentDisplayName } from "@/lib/parent";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: Request) {
    try {
        const token = req.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];
        const decoded = verifyToken(token);

        if (!decoded) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        let user: any = null;
        if (decoded.role === "admin") {
            const repo = new UserRepository();
            user = await repo.findById(decoded.id);
        } else if (decoded.role === "parent") {
            const studentRepo = new StudentRepository();
            const student = await studentRepo.findById(decoded.id);
            if (student) {
                const parentName = await getParentDisplayName(student.id, decoded.email);
                const nameParts = parentName.trim().split(/\s+/);
                user = {
                    id: student.id,
                    email: decoded.email || student.email,
                    name: parentName || student.first_name,
                    firstName: nameParts[0] || parentName || student.first_name,
                    lastName: nameParts.slice(1).join(" ") || student.last_name || "",
                    role: "parent",
                    studentId: student.id,
                };
            }
        } else if (decoded.role === "teacher") {
            const repo = new TeacherRepository();
            // Primary: find by ID in Teacher collection
            user = await repo.findById(decoded.id);
            // Fallback: token might store a User._id (old sessions) - look up by email
            if (!user && decoded.email) {
                const teachers = await repo.find({ email: decoded.email });
                if (teachers.length > 0) user = teachers[0];
            }
            // Fallback 2: try User model (edge case where teacher logged in via User table)
            if (!user) {
                const userRepo = new UserRepository();
                const userRecord = await userRepo.findById(decoded.id);
                if (userRecord) user = userRecord;
            }
        } else if (decoded.role === "student") {
            const repo = new StudentRepository();
            user = await repo.findById(decoded.id);
            if (user) {
                user = {
                    ...user,
                    name: user.first_name,
                    firstName: user.first_name,
                    lastName: user.last_name || "",
                };
            }
        }

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        if (decoded.role === "admin" && user) {
            user = {
                ...user,
                name: user.name || user.first_name || "",
                firstName: user.first_name || user.firstName || "",
                lastName: user.last_name || user.lastName || "",
            };
        }

        user.id = user.id.toString();
        user._id = user.id;
        user.role = decoded.role;
        delete user.password;

        return NextResponse.json({ success: true, user });
    } catch (error) {
        console.error("[api/auth/profile] GET error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const token = req.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];
        const decoded = verifyToken(token);

        if (!decoded) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { name, firstName, lastName, email, password } = body;

        let updateData: any = {};
        if (name) updateData.name = name;
        if (firstName) updateData.first_name = firstName;
        if (lastName) updateData.last_name = lastName;
        if (email) updateData.email = email;
        if (password) {
            const salt = await bcrypt.genSalt(10);
            updateData.password = await bcrypt.hash(password, salt);
        }

        let updatedUser: any = null;
        if (decoded.role === "admin") {
            const repo = new UserRepository();
            updatedUser = await repo.update(decoded.id, updateData);
        } else if (decoded.role === "parent") {
            const displayName = name || [firstName, lastName].filter(Boolean).join(" ").trim();
            if (displayName && decoded.email) {
                await supabaseAdmin
                    .from("student_parents")
                    .update({ name: displayName, ...(email ? { email } : {}) })
                    .eq("email", decoded.email);
            }
            const studentRepo = new StudentRepository();
            const student = await studentRepo.findById(decoded.id);
            if (student) {
                const parentName = await getParentDisplayName(student.id, decoded.email);
                const nameParts = parentName.trim().split(/\s+/);
                updatedUser = {
                    id: student.id,
                    email: decoded.email || student.email,
                    name: parentName || student.first_name,
                    firstName: nameParts[0] || parentName || student.first_name,
                    lastName: nameParts.slice(1).join(" ") || student.last_name || "",
                    role: "parent",
                };
            }
            if (password) {
                await studentRepo.update(decoded.id, { password: updateData.password });
            }
            if (email) {
                await studentRepo.update(decoded.id, { email });
            }
        } else if (decoded.role === "teacher") {
            const repo = new TeacherRepository();
            updatedUser = await repo.update(decoded.id, updateData);
        } else if (decoded.role === "student") {
            const repo = new StudentRepository();
            updatedUser = await repo.update(decoded.id, updateData);
        }

        if (!updatedUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        updatedUser._id = updatedUser.id;
        delete updatedUser.password;

        return NextResponse.json({ success: true, user: updatedUser });
    } catch (error) {
        console.error("[api/auth/profile] PUT error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
