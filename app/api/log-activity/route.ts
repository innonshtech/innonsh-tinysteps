import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: Request) {
  try {
    const token = req.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];
    const user = verifyToken(token);
    if (!user || user.role !== "admin")
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
    const limit = Math.max(1, Math.min(100, parseInt(url.searchParams.get("limit") || "50")));

    let query = supabaseAdmin.from('log_activities').select('*', { count: 'exact' });

    if (url.searchParams.get("actorEmail")) query = query.eq("actor_email", url.searchParams.get("actorEmail"));
    if (url.searchParams.get("result")) query = query.eq("result", url.searchParams.get("result"));
    if (url.searchParams.get("actorRole")) query = query.eq("actor_role", url.searchParams.get("actorRole"));

    const skip = (page - 1) * limit;

    const { data: logsData, count, error } = await query
      .order('created_at', { ascending: false })
      .range(skip, skip + limit - 1);

    if (error) throw error;

    // Optional: get actors (users)
    const actorIds = [...new Set((logsData || []).filter((l: any) => l.actor_id).map((l: any) => l.actor_id))];
    let actorsMap: any = {};
    if (actorIds.length > 0) {
      const { data: users } = await supabaseAdmin.from('users').select('id, name, email').in('id', actorIds);
      if (users) {
        users.forEach((u: any) => actorsMap[u.id] = { _id: u.id, name: u.name, email: u.email });
      }
    }

    const mappedLogs = (logsData || []).map((l: any) => ({
      ...l,
      _id: l.id,
      actorId: actorsMap[l.actor_id] || l.actor_id,
      actorEmail: l.actor_email,
      actorRole: l.actor_role,
      createdAt: l.created_at,
      userAgent: l.user_agent
    }));

    return NextResponse.json({ success: true, logs: mappedLogs, pagination: { page, limit, total: count, pages: Math.ceil((count || 0) / limit) } });
  } catch (error) {
    console.error("[GET /api/log-activity]", error);
    return NextResponse.json({ success: false, error: "Failed to fetch log activity" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { data: entry, error } = await supabaseAdmin.from('log_activities').insert({
      actor_id: body.actorId,
      actor_email: body.actorEmail,
      actor_role: body.actorRole,
      action: body.action,
      result: body.result,
      message: body.message,
      ip: body.ip,
      user_agent: body.userAgent,
      metadata: body.metadata
    }).select('*').single();

    if (error) throw error;

    // Optional: get actor
    let actorObj = entry.actor_id;
    if (entry.actor_id) {
       const { data: user } = await supabaseAdmin.from('users').select('name, email').eq('id', entry.actor_id).single();
       if (user) actorObj = { _id: entry.actor_id, name: user.name, email: user.email };
    }

    const mappedEntry = {
      ...entry,
      _id: entry.id,
      actorId: actorObj,
      actorEmail: entry.actor_email,
      actorRole: entry.actor_role,
      userAgent: entry.user_agent,
      createdAt: entry.created_at
    };

    return NextResponse.json({ success: true, entry: mappedEntry }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/log-activity]", error);
    return NextResponse.json({ success: false, error: "Failed to create log entry" }, { status: 500 });
  }
}
