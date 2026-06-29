import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { logAdminActivity } from "@/lib/logAdminActivity";
import { TransportRouteRepository, TransportStopRepository, TransportStudentAssignmentRepository } from "@/repositories/transport.repository";

export async function GET(req: Request) {
  try {
    const token = req.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];
    const user = verifyToken(token);

    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
    const limit = Math.max(1, Math.min(100, parseInt(url.searchParams.get("limit") || "10")));
    const status = url.searchParams.get("status") || "active";

    const skip = (page - 1) * limit;

    const repo = new TransportRouteRepository();
    const { data: rawRoutes, count, error } = await repo.getClient().from('transport_routes')
        .select('*, driverId:users(id, name, email), stops:transport_stops(*), studentAssignments:transport_student_assignments(students(id, first_name, last_name, admission_no))', { count: 'exact' })
        .eq('status', status)
        .order('route_name', { ascending: true })
        .range(skip, skip + limit - 1);
        
    if (error) throw error;

    const routes = (rawRoutes || []).map((r: any) => ({
      _id: r.id,
      id: r.id,
      routeName: r.route_name,
      routeCode: r.route_code,
      description: r.description,
      driverId: r.driverId ? { _id: r.driverId.id, name: r.driverId.name, phone: r.driverId.phone, email: r.driverId.email } : null,
      driverName: r.driver_name,
      driverPhone: r.driver_phone,
      vehicleNumber: r.vehicle_number,
      vehicleType: r.vehicle_type,
      capacity: r.capacity,
      status: r.status,
      isActive: r.is_active,
      stops: r.stops ? r.stops.map((s: any) => ({
          _id: s.id,
          stopName: s.stop_name,
          location: s.location,
          pickupTime: s.pickup_time,
          dropTime: s.drop_time,
          sequence: s.sequence,
          lat: s.lat,
          lng: s.lng
      })) : [],
      students: r.studentAssignments ? r.studentAssignments.map((sa: any) => ({
          _id: sa.students.id,
          firstName: sa.students.first_name,
          lastName: sa.students.last_name,
          admissionNo: sa.students.admission_no
      })) : [],
      createdAt: r.created_at,
      updatedAt: r.updated_at
    }));

    return NextResponse.json({
      success: true,
      routes,
      pagination: { page, limit, total: count || 0, pages: Math.ceil((count || 0) / limit) },
    });
  } catch (error) {
    console.error("[GET /api/transport/routes]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch routes" },
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
    const {
      routeName,
      routeCode,
      description,
      driverId,
      driverName,
      driverPhone,
      vehicleNumber,
      vehicleType,
      capacity,
      stops,
      students,
      status,
      isActive
    } = body;

    if (!routeName) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const repo = new TransportRouteRepository();
    const createdRaw = await repo.create({
      route_name: routeName,
      route_code: routeCode?.trim() || undefined,
      description,
      driver_id: driverId && driverId !== "" ? driverId : null,
      driver_name: driverName,
      driver_phone: driverPhone,
      vehicle_number: vehicleNumber,
      vehicle_type: vehicleType,
      capacity,
      status: status || "active",
      is_active: isActive !== undefined ? isActive : true,
    });
    
    if (stops && Array.isArray(stops) && stops.length > 0) {
        const stopRepo = new TransportStopRepository();
        const stopInserts = stops.map((s: any) => ({
            route_id: createdRaw.id,
            stop_name: s.stopName,
            location: s.location,
            pickup_time: s.pickupTime,
            drop_time: s.dropTime,
            sequence: s.sequence,
            lat: s.lat,
            lng: s.lng
        }));
        await stopRepo.getClient().from('transport_stops').insert(stopInserts);
    }
    
    if (students && Array.isArray(students) && students.length > 0) {
        const studentAssignments = students.map((sId: any) => ({
            route_id: createdRaw.id,
            student_id: sId._id || sId.id || sId
        }));
        await repo.getClient().from('transport_student_assignments').insert(studentAssignments);
    }
    
    // fetch full
    const { data: fullRoutes } = await repo.getClient().from('transport_routes')
        .select('*, driverId:users(id, name, email), stops:transport_stops(*), studentAssignments:transport_student_assignments(students(id, first_name, last_name, admission_no))')
        .eq('id', createdRaw.id);
        
    const r = fullRoutes && fullRoutes.length > 0 ? fullRoutes[0] : createdRaw;
    
    const route = {
      _id: r.id,
      id: r.id,
      routeName: r.route_name,
      routeCode: r.route_code,
      description: r.description,
      driverId: r.driverId ? { _id: r.driverId.id, name: r.driverId.name, phone: r.driverId.phone, email: r.driverId.email } : null,
      driverName: r.driver_name,
      driverPhone: r.driver_phone,
      vehicleNumber: r.vehicle_number,
      vehicleType: r.vehicle_type,
      capacity: r.capacity,
      status: r.status,
      isActive: r.is_active,
      stops: r.stops ? r.stops.map((s: any) => ({
          _id: s.id,
          stopName: s.stop_name,
          location: s.location,
          pickupTime: s.pickup_time,
          dropTime: s.drop_time,
          sequence: s.sequence,
          lat: s.lat,
          lng: s.lng
      })) : (stops || []),
      students: r.studentAssignments ? r.studentAssignments.map((sa: any) => ({
          _id: sa.students.id,
          firstName: sa.students.first_name,
          lastName: sa.students.last_name,
          admissionNo: sa.students.admission_no
      })) : (students || []),
      createdAt: r.created_at,
      updatedAt: r.updated_at
    };

    // Log admin activity
    await logAdminActivity({
      actorId: String(user.id),
      actorRole: user.role,
      action: "create:transport",
      message: `Transport route created: ${route.routeName}`,
      metadata: {
        routeId: route.id,
        routeName: route.routeName,
        routeCode: route.routeCode,
      },
    });

    return NextResponse.json({ success: true, route }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/transport/routes]", error);
    return NextResponse.json(
      { success: false, error: "Failed to create route" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
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
    const { id, stops, students, ...updateDataRaw } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Route ID is required" },
        { status: 400 }
      );
    }

    // Clean up empty strings for IDs and unique fields
    if (updateDataRaw.driverId === "") updateDataRaw.driverId = null;
    if (updateDataRaw.routeCode === "") updateDataRaw.routeCode = undefined;
    
    const updatePayload: any = { ...updateDataRaw };
    delete updatePayload._id;
    if (updatePayload.routeName !== undefined) updatePayload.route_name = updatePayload.routeName;
    if (updatePayload.routeCode !== undefined) updatePayload.route_code = updatePayload.routeCode;
    if (updatePayload.driverId !== undefined) updatePayload.driver_id = updatePayload.driverId;
    if (updatePayload.driverName !== undefined) updatePayload.driver_name = updatePayload.driverName;
    if (updatePayload.driverPhone !== undefined) updatePayload.driver_phone = updatePayload.driverPhone;
    if (updatePayload.vehicleNumber !== undefined) updatePayload.vehicle_number = updatePayload.vehicleNumber;
    if (updatePayload.vehicleType !== undefined) updatePayload.vehicle_type = updatePayload.vehicleType;
    if (updatePayload.isActive !== undefined) updatePayload.is_active = updatePayload.isActive;
    
    delete updatePayload.routeName;
    delete updatePayload.routeCode;
    delete updatePayload.driverId;
    delete updatePayload.driverName;
    delete updatePayload.driverPhone;
    delete updatePayload.vehicleNumber;
    delete updatePayload.vehicleType;
    delete updatePayload.isActive;
    delete updatePayload.createdAt;
    delete updatePayload.updatedAt;

    const repo = new TransportRouteRepository();
    const updatedRaw = await repo.update(id, updatePayload);

    if (!updatedRaw) {
      return NextResponse.json(
        { success: false, error: "Route not found" },
        { status: 404 }
      );
    }
    
    if (stops && Array.isArray(stops)) {
        await repo.getClient().from('transport_stops').delete().eq('route_id', id);
        if (stops.length > 0) {
            const stopInserts = stops.map((s: any) => ({
                route_id: id,
                stop_name: s.stopName,
                location: s.location,
                pickup_time: s.pickupTime,
                drop_time: s.dropTime,
                sequence: s.sequence,
                lat: s.lat,
                lng: s.lng
            }));
            await repo.getClient().from('transport_stops').insert(stopInserts);
        }
    }
    
    if (students && Array.isArray(students)) {
        await repo.getClient().from('transport_student_assignments').delete().eq('route_id', id);
        if (students.length > 0) {
            const studentAssignments = students.map((sId: any) => ({
                route_id: id,
                student_id: sId._id || sId.id || sId
            }));
            await repo.getClient().from('transport_student_assignments').insert(studentAssignments);
        }
    }
    
    // fetch full
    const { data: fullRoutes } = await repo.getClient().from('transport_routes')
        .select('*, driverId:users(id, name, email), stops:transport_stops(*), studentAssignments:transport_student_assignments(students(id, first_name, last_name, admission_no))')
        .eq('id', id);
        
    const r = fullRoutes && fullRoutes.length > 0 ? fullRoutes[0] : updatedRaw;
    
    const route = {
      _id: r.id,
      id: r.id,
      routeName: r.route_name,
      routeCode: r.route_code,
      description: r.description,
      driverId: r.driverId ? { _id: r.driverId.id, name: r.driverId.name, phone: r.driverId.phone, email: r.driverId.email } : null,
      driverName: r.driver_name,
      driverPhone: r.driver_phone,
      vehicleNumber: r.vehicle_number,
      vehicleType: r.vehicle_type,
      capacity: r.capacity,
      status: r.status,
      isActive: r.is_active,
      stops: r.stops ? r.stops.map((s: any) => ({
          _id: s.id,
          stopName: s.stop_name,
          location: s.location,
          pickupTime: s.pickup_time,
          dropTime: s.drop_time,
          sequence: s.sequence,
          lat: s.lat,
          lng: s.lng
      })) : [],
      students: r.studentAssignments ? r.studentAssignments.map((sa: any) => ({
          _id: sa.students.id,
          firstName: sa.students.first_name,
          lastName: sa.students.last_name,
          admissionNo: sa.students.admission_no
      })) : [],
      createdAt: r.created_at,
      updatedAt: r.updated_at
    };

    return NextResponse.json({ success: true, route });
  } catch (error) {
    console.error("[PUT /api/transport/routes]", error);
    return NextResponse.json(
      { success: false, error: "Failed to update route" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const token = req.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];
    const user = verifyToken(token);

    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Route ID is required" },
        { status: 400 }
      );
    }

    const repo = new TransportRouteRepository();
    const route = await repo.delete(id);

    return NextResponse.json({ success: true, message: "Route deleted successfully" });
  } catch (error) {
    console.error("[DELETE /api/transport/routes]", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete route" },
      { status: 500 }
    );
  }
}
