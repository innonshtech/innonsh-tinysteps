import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { NotificationRepository } from "@/repositories/notification.repository";
import { UserRepository } from "@/repositories/user.repository";

export async function GET(req: Request) {
  try {
    const token = req.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];
    const user = verifyToken(token);

    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
    const limit = Math.max(1, Math.min(100, parseInt(url.searchParams.get("limit") || "20")));
    const unreadOnly = url.searchParams.get("unread") === "true";

    const filter: Record<string, unknown> = {};
    if (user.role !== "admin") {
      filter.recipient_id = user.id;
    }
    
    if (unreadOnly) filter.is_read = false;

    const skip = (page - 1) * limit;

    const unreadFilter: Record<string, unknown> = { is_read: false };
    if (user.role !== "admin") {
      unreadFilter.recipient_id = user.id;
    }

    const notificationRepo = new NotificationRepository();
    
    const notificationsData = await notificationRepo.find(filter, {
        skip,
        limit,
        sort: { field: "created_at", ascending: false }
    });
    const total = await notificationRepo.count(filter);
    
    const unreadCount = await notificationRepo.count(unreadFilter);

    // Ideally we would join with users to get recipient name and email, 
    // but for now we'll format it back to the expected structure.
    const userRepo = new UserRepository();
    const notifications = await Promise.all(notificationsData.map(async (n: any) => {
        let recipient = null;
        if (n.recipient_id) {
            const u = await userRepo.findById(n.recipient_id);
            if (u) recipient = { _id: u.id, name: u.first_name + ' ' + u.last_name, email: u.email };
        }
        
        return {
            _id: n.id,
            id: n.id,
            recipientId: recipient,
            type: n.type,
            title: n.title,
            message: n.message,
            priority: n.priority,
            actionUrl: n.action_url,
            icon: n.icon,
            isRead: n.is_read,
            readAt: n.read_at,
            createdAt: n.created_at,
            updatedAt: n.updated_at
        };
    }));

    return NextResponse.json({
      success: true,
      notifications,
      unreadCount,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("[GET /api/notifications]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const token = req.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];
    const user = verifyToken(token);

    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { recipientId, type, title, message, priority, actionUrl, icon } = body;

    if (!recipientId || !type || !title || !message) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const notificationRepo = new NotificationRepository();
    const created = await notificationRepo.create({
      recipient_id: recipientId,
      type,
      title,
      message,
      priority: priority || 'normal',
      action_url: actionUrl,
      icon,
    });

    const userRepo = new UserRepository();
    let recipient = null;
    const u = await userRepo.findById(recipientId);
    if (u) recipient = { _id: u.id, name: u.first_name + ' ' + u.last_name, email: u.email };

    const notification = {
        _id: created.id,
        id: created.id,
        recipientId: recipient,
        type: created.type,
        title: created.title,
        message: created.message,
        priority: created.priority,
        actionUrl: created.action_url,
        icon: created.icon,
        isRead: created.is_read,
        readAt: created.read_at,
        createdAt: created.created_at,
        updatedAt: created.updated_at
    };

    return NextResponse.json({ success: true, notification }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/notifications]", error);
    return NextResponse.json(
      { success: false, error: "Failed to create notification" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const token = req.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];
    const user = verifyToken(token);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { id, isRead } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Notification ID is required" },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (isRead !== undefined) {
      updateData.is_read = isRead;
      if (isRead) updateData.read_at = new Date().toISOString();
    }

    const notificationRepo = new NotificationRepository();
    const updated = await notificationRepo.update(id, updateData);

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Notification not found" },
        { status: 404 }
      );
    }
    
    const userRepo = new UserRepository();
    let recipient = null;
    if (updated.recipient_id) {
        const u = await userRepo.findById(updated.recipient_id);
        if (u) recipient = { _id: u.id, name: u.first_name + ' ' + u.last_name, email: u.email };
    }

    const notification = {
        _id: updated.id,
        id: updated.id,
        recipientId: recipient,
        type: updated.type,
        title: updated.title,
        message: updated.message,
        priority: updated.priority,
        actionUrl: updated.action_url,
        icon: updated.icon,
        isRead: updated.is_read,
        readAt: updated.read_at,
        createdAt: updated.created_at,
        updatedAt: updated.updated_at
    };

    return NextResponse.json({ success: true, notification });
  } catch (error) {
    console.error("[PUT /api/notifications]", error);
    return NextResponse.json(
      { success: false, error: "Failed to update notification" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const token = req.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];
    const user = verifyToken(token);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Notification ID is required" },
        { status: 400 }
      );
    }

    const notificationRepo = new NotificationRepository();
    
    try {
        await notificationRepo.delete(id);
    } catch(err) {
        return NextResponse.json(
            { success: false, error: "Notification not found" },
            { status: 404 }
        );
    }

    return NextResponse.json({ success: true, message: "Notification deleted successfully" });
  } catch (error) {
    console.error("[DELETE /api/notifications]", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete notification" },
      { status: 500 }
    );
  }
}
