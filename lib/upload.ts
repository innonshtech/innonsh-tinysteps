// lib/upload.ts
import { createClient } from "@supabase/supabase-js";

export async function uploadFile(
  buffer: Buffer,
  folder: string,
  filename: string = "upload.jpg",
  contentType: string = "image/jpeg"
): Promise<{ secure_url: string; public_id: string }> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const uniqueFilename = `${Date.now()}_${filename.replace(/[^a-zA-Z0-9.]/g, "_")}`;
  
  const { data, error } = await supabase.storage
    .from(folder)
    .upload(uniqueFilename, buffer, {
      contentType,
      upsert: false
    });

  if (error) {
    throw new Error(`Supabase upload failed: ${error.message}`);
  }

  const { data: publicUrlData } = supabase.storage
    .from(folder)
    .getPublicUrl(data.path);

  return {
    secure_url: publicUrlData.publicUrl,
    public_id: data.path,
  };
}