import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { logAdminActivity } from "@/lib/logAdminActivity";
import { dispatchEventNotification } from "@/lib/notification.service";
import { EventRepository } from "@/repositories/event.repository";

export async function GET(req: Request) {
  try {
    const token = req.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];
    const user = verifyToken(token);

    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
    const limit = Math.max(1, Math.min(500, parseInt(url.searchParams.get("limit") || "10")));
    const status = url.searchParams.get("status") || "published";

    const skip = (page - 1) * limit;

    const eventRepo = new EventRepository();
    const query = eventRepo.getClient().from('events')
      .select('*, classIds:event_class_targets(class:classes(id, name, section))', { count: 'exact' })
      .eq('status', status)
      .order('start_date', { ascending: false })
      .range(skip, skip + limit - 1);

    const { data: rawEvents, count, error } = await query;
    if (error) throw error;

    const events = rawEvents.map((e: any) => ({
      _id: e.id,
      id: e.id,
      title: e.title,
      description: e.description,
      eventType: e.event_type,
      startDate: e.start_date,
      endDate: e.end_date,
      startTime: e.start_time,
      endTime: e.end_time,
      location: e.location,
      image: e.image,
      targetAudience: e.target_audience,
      status: e.status,
      notify: e.notify,
      notificationType: e.notification_type,
      fcmSent: e.fcm_sent,
      fcmSentAt: e.fcm_sent_at,
      fcmRecipientCount: e.fcm_recipient_count,
      attachments: e.attachments ?? [],
      createdAt: e.created_at,
      updatedAt: e.updated_at,
      classIds: (e.classIds || []).map((c: any) => ({
        _id: c.class?.id,
        id: c.class?.id,
        name: c.class?.name,
        section: c.class?.section
      }))
    }));

    return NextResponse.json({
      success: true,
      events,
      pagination: { page, limit, total: count || 0, pages: Math.ceil((count || 0) / limit) },
    });
  } catch (error) {
    console.error("[GET /api/events]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const token = req.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];
    const user = verifyToken(token);

    if (!user || !["admin", "teacher"].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { title, description, eventType, startDate, endDate, startTime, endTime, location, image, targetAudience, classIds, status, notify, attachments } = body;

    if (!title || !startDate) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const eventRepo = new EventRepository();
    const createdEvent = await eventRepo.create({
      title,
      description,
      event_type: eventType || 'notification',
      start_date: new Date(startDate).toISOString().split('T')[0],
      end_date: endDate ? new Date(endDate).toISOString().split('T')[0] : null,
      start_time: startTime || null,
      end_time: endTime || null,
      location,
      image,
      target_audience: targetAudience || 'all',
      status: status || "draft",
      notify: notify !== undefined ? notify : true,
    });

    if (classIds && Array.isArray(classIds) && classIds.length > 0) {
      const inserts = classIds.map(cid => ({ event_id: createdEvent.id, class_id: cid }));
      await eventRepo.getClient().from('event_class_targets').insert(inserts);
    }

    const event = {
      _id: createdEvent.id,
      id: createdEvent.id,
      title: createdEvent.title,
      description: createdEvent.description,
      eventType: createdEvent.event_type,
      startDate: createdEvent.start_date,
      endDate: createdEvent.end_date,
      startTime: createdEvent.start_time,
      endTime: createdEvent.end_time,
      location: createdEvent.location,
      image: createdEvent.image,
      targetAudience: createdEvent.target_audience,
      status: createdEvent.status,
      notify: createdEvent.notify,
      attachments: attachments ?? [],
      classIds: classIds || []
    };

    // Log activity only for admin
    if (user.role === "admin") {
      await logAdminActivity({
        actorId: String(user.id),
        actorRole: user.role,
        action: "create:event",
        message: `Event created: ${event.title}`,
        metadata: {
          eventId: event.id,
          title: event.title,
          eventType: event.eventType,
          status: event.status,
        },
      });
    }

    // ── FCM Publish Hook (for events created as published) ─────────────────
    if (event.status === "published" && event.notify) {
      const eventForDispatch = {
        _id: String(event.id),
        title: event.title,
        description: event.description,
        eventType: event.eventType,
        startDate: event.startDate,
        targetAudience: event.targetAudience,
        classIds: event.classIds.map((c: any) => String(c._id || c)),
        notify: event.notify,
        notificationType: 'all',
        location: event.location,
        image: event.image,
      };
      // Fire-and-forget: dispatch runs in background
      dispatchEventNotification(eventForDispatch).catch((err) =>
        console.error("[POST /api/events] FCM dispatch error:", err)
      );
    }
    // ────────────────────────────────────────────────────────────────────────

    return NextResponse.json({ success: true, event }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/events]", error);
    return NextResponse.json(
      { success: false, error: "Failed to create event" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const token = req.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];
    const user = verifyToken(token);

    if (!user || !["admin", "teacher"].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { id, classIds, attachments, ...updateDataRaw } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Event ID is required" },
        { status: 400 }
      );
    }

    const eventRepo = new EventRepository();

    // Fetch the event BEFORE update to detect status transition
    const existingEvent = await eventRepo.findById(id);
    const wasPublished = existingEvent?.status === "published";
    const isBeingPublished = updateDataRaw.status === "published";

    const updatePayload: any = {};
    if (updateDataRaw.title !== undefined) updatePayload.title = updateDataRaw.title;
    if (updateDataRaw.description !== undefined) updatePayload.description = updateDataRaw.description;
    if (updateDataRaw.location !== undefined) updatePayload.location = updateDataRaw.location;
    if (updateDataRaw.image !== undefined) updatePayload.image = updateDataRaw.image;
    if (updateDataRaw.status !== undefined) updatePayload.status = updateDataRaw.status;
    if (updateDataRaw.notify !== undefined) updatePayload.notify = updateDataRaw.notify;
    if (updateDataRaw.startDate) updatePayload.start_date = new Date(updateDataRaw.startDate).toISOString().split('T')[0];
    if (updateDataRaw.endDate !== undefined) updatePayload.end_date = updateDataRaw.endDate ? new Date(updateDataRaw.endDate).toISOString().split('T')[0] : null;
    if (updateDataRaw.startTime !== undefined) updatePayload.start_time = updateDataRaw.startTime;
    if (updateDataRaw.endTime !== undefined) updatePayload.end_time = updateDataRaw.endTime;
    if (updateDataRaw.eventType) updatePayload.event_type = updateDataRaw.eventType;
    if (updateDataRaw.targetAudience) updatePayload.target_audience = updateDataRaw.targetAudience;
    if (updateDataRaw.notificationType) updatePayload.notification_type = updateDataRaw.notificationType;

    const updatedRawEvent = await eventRepo.update(id, updatePayload);

    if (!updatedRawEvent) {
      return NextResponse.json(
        { success: false, error: "Event not found" },
        { status: 404 }
      );
    }

    if (classIds && Array.isArray(classIds)) {
      await eventRepo.getClient().from('event_class_targets').delete().eq('event_id', id);
      if (classIds.length > 0) {
        const inserts = classIds.map((cid: any) => ({ event_id: id, class_id: cid._id || cid.id || cid }));
        await eventRepo.getClient().from('event_class_targets').insert(inserts);
      }
    }

    const event = {
      _id: updatedRawEvent.id,
      id: updatedRawEvent.id,
      title: updatedRawEvent.title,
      description: updatedRawEvent.description,
      eventType: updatedRawEvent.event_type,
      startDate: updatedRawEvent.start_date,
      endDate: updatedRawEvent.end_date,
      startTime: updatedRawEvent.start_time,
      endTime: updatedRawEvent.end_time,
      location: updatedRawEvent.location,
      image: updatedRawEvent.image,
      targetAudience: updatedRawEvent.target_audience,
      status: updatedRawEvent.status,
      notify: updatedRawEvent.notify,
      notificationType: updatedRawEvent.notification_type,
      attachments: attachments ?? [],
      classIds: classIds || []
    };

    // ── Trigger FCM push asynchronously (non-blocking) ──────────────────────
    if (isBeingPublished && !wasPublished && !existingEvent?.fcm_sent && event.notify) {
      const eventForDispatch = {
        _id: String(event.id),
        title: event.title,
        description: event.description,
        eventType: event.eventType,
        startDate: event.startDate,
        targetAudience: event.targetAudience,
        classIds: (event.classIds || []).map((c: any) => String(c._id || c.id || c)),
        notify: event.notify,
        notificationType: event.notificationType,
        location: event.location,
        image: event.image,
      };
      // Fire-and-forget: dispatch runs in background
      dispatchEventNotification(eventForDispatch).catch((err) =>
        console.error("[PUT /api/events] FCM dispatch error:", err)
      );
    }
    // ────────────────────────────────────────────────────────────────────────

    return NextResponse.json({ success: true, event });
  } catch (error: any) {
    console.error("[PUT /api/events]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update event" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const token = req.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];
    const user = verifyToken(token);

    if (!user || !["admin", "teacher"].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Event ID is required" },
        { status: 400 }
      );
    }

    const eventRepo = new EventRepository();
    const event = await eventRepo.delete(id);

    return NextResponse.json({ success: true, message: "Event deleted successfully" });
  } catch (error) {
    console.error("[DELETE /api/events]", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete event" },
      { status: 500 }
    );
  }
}
