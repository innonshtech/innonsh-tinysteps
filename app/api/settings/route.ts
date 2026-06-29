import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: Request) {
  try {
    const token = req.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];
    const user = verifyToken(token);

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    let { data: settings } = await supabaseAdmin.from('school_settings').select('*').limit(1).single();

    if (!settings) {
      let { data: school } = await supabaseAdmin.from('schools').select('id').limit(1).maybeSingle();
      if (!school) {
         let { data: tenant } = await supabaseAdmin.from('tenants').select('id').limit(1).maybeSingle();
         if (!tenant) {
            const { data: newTenant } = await supabaseAdmin.from('tenants').insert({ name: 'Default Tenant' }).select('id').single();
            tenant = newTenant;
         }
         const { data: newSchool } = await supabaseAdmin.from('schools').insert({ tenant_id: tenant?.id, school_name: 'Default School' }).select('id').single();
         school = newSchool;
      }
      const { data: newSettings, error } = await supabaseAdmin.from('school_settings').insert({
        school_id: school?.id,
        school_name: "Pre-Primary School",
        academic_year: "2024-2025",
      }).select('*').single();
      
      if (!error && newSettings) {
         settings = newSettings;
      }
    }

    const mappedSettings = settings ? {
      ...settings,
      _id: settings.id,
      schoolName: settings.school_name || "",
      schoolLogo: settings.school_logo || "",
      schoolAddress: settings.school_address || "",
      schoolPhone: settings.school_phone || "",
      schoolEmail: settings.school_email || "",
      principalName: settings.principal_name || "",
      academicYear: settings.academic_year || "",
      subjects: settings.subjects || [],
      termDates: settings.term_dates,
      holidays: settings.holidays || [],
      leaveQuotas: settings.leave_quotas,
      featureFlags: settings.feature_flags,
      paymentGateway: settings.payment_gateway,
      emailSettings: settings.email_settings,
      notificationSettings: settings.notification_settings,
    } : null;

    return NextResponse.json({ success: true, settings: mappedSettings });
  } catch (error) {
    console.error("[GET /api/settings]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch settings" },
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
    
    // Map camelCase body to snake_case for Supabase
    const updateData: any = {};
    if (body.schoolName) updateData.school_name = body.schoolName;
    if (body.academicYear) updateData.academic_year = body.academicYear;
    if (body.schoolLogo) updateData.school_logo = body.schoolLogo;
    if (body.schoolAddress) updateData.school_address = body.schoolAddress;
    if (body.schoolPhone) updateData.school_phone = body.schoolPhone;
    if (body.schoolEmail) updateData.school_email = body.schoolEmail;
    if (body.principalName) updateData.principal_name = body.principalName;
    if (body.subjects) updateData.subjects = body.subjects;
    if (body.termDates) updateData.term_dates = body.termDates;
    if (body.holidays) updateData.holidays = body.holidays;
    if (body.leaveQuotas) updateData.leave_quotas = body.leaveQuotas;
    if (body.featureFlags) updateData.feature_flags = body.featureFlags;
    if (body.paymentGateway) updateData.payment_gateway = body.paymentGateway;
    if (body.emailSettings) updateData.email_settings = body.emailSettings;
    if (body.notificationSettings) updateData.notification_settings = body.notificationSettings;

    let { data: settings } = await supabaseAdmin.from('school_settings').select('*').limit(1).single();

    let updatedSettings;
    if (!settings) {
      let { data: school } = await supabaseAdmin.from('schools').select('id').limit(1).maybeSingle();
      if (!school) {
         let { data: tenant } = await supabaseAdmin.from('tenants').select('id').limit(1).maybeSingle();
         if (!tenant) {
            const { data: newTenant } = await supabaseAdmin.from('tenants').insert({ name: 'Default Tenant' }).select('id').single();
            tenant = newTenant;
         }
         const { data: newSchool } = await supabaseAdmin.from('schools').insert({ tenant_id: tenant?.id, school_name: 'Default School' }).select('id').single();
         school = newSchool;
      }
      const { data, error } = await supabaseAdmin.from('school_settings').insert({
          ...updateData,
          school_id: school?.id
      }).select('*').single();
      if (error) console.error('[PUT /api/settings] Insert error:', error);
      updatedSettings = data;
    } else {
      const { data, error } = await supabaseAdmin.from('school_settings').update(updateData).eq('id', settings.id).select('*').single();
      if (error) console.error('[PUT /api/settings] Update error:', error);
      updatedSettings = data;
    }

    const mappedSettings = updatedSettings ? {
      ...updatedSettings,
      _id: updatedSettings.id,
      schoolName: updatedSettings.school_name || "",
      schoolLogo: updatedSettings.school_logo || "",
      schoolAddress: updatedSettings.school_address || "",
      schoolPhone: updatedSettings.school_phone || "",
      schoolEmail: updatedSettings.school_email || "",
      principalName: updatedSettings.principal_name || "",
      academicYear: updatedSettings.academic_year || "",
      subjects: updatedSettings.subjects || [],
      termDates: updatedSettings.term_dates,
      holidays: updatedSettings.holidays || [],
      leaveQuotas: updatedSettings.leave_quotas,
      featureFlags: updatedSettings.feature_flags,
      paymentGateway: updatedSettings.payment_gateway,
      emailSettings: updatedSettings.email_settings,
      notificationSettings: updatedSettings.notification_settings,
    } : null;

    return NextResponse.json({ success: true, settings: mappedSettings });
  } catch (error) {
    console.error("[PUT /api/settings]", error);
    return NextResponse.json(
      { success: false, error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
