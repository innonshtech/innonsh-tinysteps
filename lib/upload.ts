// lib/upload.ts
import { createClient } from "@supabase/supabase-js";

export async function uploadFile(
  buffer: Buffer,
  folder: string = "admissions",
  filename: string = "upload.jpg",
  contentType: string = "image/jpeg"
): Promise<{ secure_url: string; public_id: string }> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !serviceKey) {
    throw new Error("Supabase URL or key is missing in environment variables.");
  }

  const supabase = createClient(supabaseUrl, serviceKey);
  const safeBucket = folder.split("/")[0] || "admissions";
  const uniqueFilename = `${Date.now()}_${filename.replace(/[^a-zA-Z0-9.]/g, "_")}`;

  // Ensure bucket exists
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some((b) => b.name === safeBucket);
    if (!bucketExists) {
      await supabase.storage.createBucket(safeBucket, { public: true });
    }
  } catch (e) {
    console.warn("Storage bucket check warning:", e);
  }

  const { data, error } = await supabase.storage
    .from(safeBucket)
    .upload(uniqueFilename, buffer, {
      contentType,
      upsert: true,
    });

  if (error) {
    throw new Error(`Supabase upload failed: ${error.message}`);
  }

  const { data: publicUrlData } = supabase.storage
    .from(safeBucket)
    .getPublicUrl(data.path);

  return {
    secure_url: publicUrlData.publicUrl,
    public_id: data.path,
  };
}