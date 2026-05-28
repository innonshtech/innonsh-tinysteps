// app/api/admission/upload/route.ts
import { NextResponse } from "next/server";
import formidable from "formidable";
import { promises as fs } from "fs";
import { uploadFile } from "@/lib/upload";

export const runtime = "nodejs";

interface FormidableFile {
  filepath: string;
  originalFilename?: string | null;
  mimetype?: string | null;
  size: number;
}

interface FormidableParseResult {
  fields: formidable.Fields;
  files: { file?: FormidableFile[] };
}

export async function POST(req: Request) {
  try {
    // Initialize Formidable
    const form = formidable({
      maxFileSize: 12 * 1024 * 1024, // 12MB
      multiples: false,
      keepExtensions: true,
    });

    const parsed: FormidableParseResult = await new Promise((resolve, reject) => {
      form.parse(req as any, (err, fields, files) => {
        if (err) return reject(err);
        resolve({ fields, files });
      });
    });

    const file = parsed.files.file?.[0];
    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    // Read file buffer
    const buffer = await fs.readFile(file.filepath);

    // Upload to Cloudinary
    const uploaded = await uploadFile(buffer, "erp/admissions");

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