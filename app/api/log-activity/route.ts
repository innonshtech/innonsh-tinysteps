import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import LogActivity from "@/models/LogActivity";
import { verifyToken } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    await connectDB();

    const token = req.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];
    const user = verifyToken(token);
    if (!user || user.role !== "admin")
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
    const limit = Math.max(1, Math.min(100, parseInt(url.searchParams.get("limit") || "50")));

    const filter: Record<string, any> = {};
    if (url.searchParams.get("actorEmail")) filter.actorEmail = url.searchParams.get("actorEmail");
    if (url.searchParams.get("result")) filter.result = url.searchParams.get("result");
    if (url.searchParams.get("actorRole")) filter.actorRole = url.searchParams.get("actorRole");

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      LogActivity.find(filter)
        .populate("actorId", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      LogActivity.countDocuments(filter),
    ]);

    return NextResponse.json({ success: true, logs, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error("[GET /api/log-activity]", error);
    return NextResponse.json({ success: false, error: "Failed to fetch log activity" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    const entry = new LogActivity(body);
    await entry.save();
    await entry.populate("actorId", "name email");

    return NextResponse.json({ success: true, entry }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/log-activity]", error);
    return NextResponse.json({ success: false, error: "Failed to create log entry" }, { status: 500 });
  }
}
