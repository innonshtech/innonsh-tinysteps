// app/api/admission/upload/route.ts
import { NextResponse } from "next/server";
import { uploadFile } from "@/lib/upload";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const filename = file.name || "upload_file";
    const contentType = file.type || "application/octet-stream";

    const uploaded = await uploadFile(buffer, "admissions", filename, contentType);

    return NextResponse.json({
      success: true,
      url: uploaded.secure_url,
      public_id: uploaded.public_id,
    });
  } catch (err: unknown) {
    console.error("UPLOAD ERROR:", err);
    const message = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}