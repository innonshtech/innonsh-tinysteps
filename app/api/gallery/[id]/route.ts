import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const token = req.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];
    const user = verifyToken(token);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    const { data: album, error } = await supabaseAdmin.from('gallery_albums').select('*').eq('id', id).single();
    
    if (!album || error) {
      return NextResponse.json(
        { success: false, error: "Gallery not found" },
        { status: 404 }
      );
    }

    // Get images
    const { data: images } = await supabaseAdmin.from('gallery_images').select('*').eq('album_id', id);

    // Collect all user IDs needed for uploadedBy and comments
    const imageIds = images?.map((img: any) => img.id) || [];
    const { data: comments } = imageIds.length > 0 
      ? await supabaseAdmin.from('gallery_image_comments').select('*').in('image_id', imageIds)
      : { data: [] };

    const uploaderIds = images?.filter((i: any) => i.uploaded_by).map((i: any) => i.uploaded_by) || [];
    const commenterIds = comments?.filter((c: any) => c.user_id).map((c: any) => c.user_id) || [];
    const allUserIds = [...new Set([...uploaderIds, ...commenterIds])];
    
    let usersMap: any = {};
    if (allUserIds.length > 0) {
      const { data: users } = await supabaseAdmin.from('users').select('id, name, email').in('id', allUserIds);
      if (users) {
        users.forEach((u: any) => usersMap[u.id] = { _id: u.id, name: u.name, email: u.email });
      }
    }

    const mappedImages = (images || []).map((img: any) => {
      const imgComments = (comments || []).filter((c: any) => c.image_id === img.id).map((c: any) => ({
        _id: c.id,
        text: c.text,
        userId: usersMap[c.user_id] || c.user_id,
        createdAt: c.created_at
      }));

      return {
        ...img,
        _id: img.id,
        uploadedBy: usersMap[img.uploaded_by] || img.uploaded_by,
        uploadedAt: img.uploaded_at,
        comments: imgComments
      };
    });

    const mappedGallery = {
      ...album,
      _id: album.id,
      albumName: album.album_name,
      eventDate: album.event_date,
      eventLocation: album.event_location,
      isPublished: album.is_published,
      createdAt: album.created_at,
      images: mappedImages
    };

    return NextResponse.json({ success: true, gallery: mappedGallery });
  } catch (error) {
    console.error("[GET /api/gallery/[id]]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch gallery details" },
      { status: 500 }
    );
  }
}
