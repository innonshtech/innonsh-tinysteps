import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { GalleryAlbumRepository } from "@/repositories/gallery.repository";

export async function GET(req: Request) {
  try {
    const token = req.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];
    const user = verifyToken(token);

    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
    const limit = Math.max(1, Math.min(1000, parseInt(url.searchParams.get("limit") || "500")));

    const skip = (page - 1) * limit;

    const repo = new GalleryAlbumRepository();
    let query = repo.getClient().from('gallery_albums')
        .select(`
            *,
            images:gallery_images(
                *,
                uploadedBy:users!uploaded_by(id, name, email),
                comments:gallery_image_comments(
                    *,
                    userId:users!user_id(id, name)
                )
            )
        `, { count: 'exact' });

    // Safety: If user is not admin, they should ONLY see published albums
    if (user.role !== "admin") {
      query = query.eq('is_published', true);
    } else {
      // Admins can filter by choice
      const status = url.searchParams.get("status");
      if (status === "published") query = query.eq('is_published', true);
      if (status === "draft") query = query.eq('is_published', false);
    }

    query = query.order('created_at', { ascending: false }).range(skip, skip + limit - 1);

    const { data: rawGalleries, count, error } = await query;
    if (error) throw error;

    const galleries = rawGalleries.map((g: any) => ({
      _id: g.id,
      id: g.id,
      title: g.title,
      description: g.description,
      albumName: g.album_name,
      category: g.category,
      eventDate: g.event_date,
      eventLocation: g.event_location,
      visibility: g.visibility,
      isPublished: g.is_published,
      featured: g.featured,
      createdAt: g.created_at,
      updatedAt: g.updated_at,
      images: g.images.map((img: any) => ({
          _id: img.id,
          id: img.id,
          url: img.url,
          type: img.type,
          caption: img.caption,
          likes: img.likes,
          uploadedAt: img.uploaded_at,
          uploadedBy: img.uploadedBy ? { _id: img.uploadedBy.id, name: img.uploadedBy.name, email: img.uploadedBy.email } : null,
          comments: img.comments ? img.comments.map((c: any) => ({
              _id: c.id,
              id: c.id,
              text: c.text,
              createdAt: c.created_at,
              userId: c.userId ? { _id: c.userId.id, name: c.userId.name } : null
          })) : []
      }))
    }));

    return NextResponse.json({
      success: true,
      galleries,
      pagination: { page, limit, total: count || 0, pages: Math.ceil((count || 0) / limit) },
    });
  } catch (error) {
    console.error("[GET /api/gallery]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch galleries" },
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
    const { title, description, albumName, category, images, eventDate, eventLocation, visibility, isPublished, featured } = body;

    if (!title || !albumName) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const repo = new GalleryAlbumRepository();
    const createdAlbum = await repo.create({
      title,
      description,
      album_name: albumName,
      category: category || 'other',
      event_date: eventDate ? new Date(eventDate).toISOString().split('T')[0] : null,
      event_location: eventLocation,
      visibility: visibility || 'parents',
      is_published: isPublished || false,
      featured: featured || false
    });

    if (images && Array.isArray(images) && images.length > 0) {
        const imageInserts = images.map((img: any) => ({
            album_id: createdAlbum.id,
            url: img.url,
            type: img.type || 'image',
            caption: img.caption,
            uploaded_by: user.id
        }));
        await repo.getClient().from('gallery_images').insert(imageInserts);
    }

    const gallery = {
        _id: createdAlbum.id,
        id: createdAlbum.id,
        title: createdAlbum.title,
        description: createdAlbum.description,
        albumName: createdAlbum.album_name,
        category: createdAlbum.category,
        eventDate: createdAlbum.event_date,
        eventLocation: createdAlbum.event_location,
        visibility: createdAlbum.visibility,
        isPublished: createdAlbum.is_published,
        featured: createdAlbum.featured,
        images: images || []
    };

    return NextResponse.json({ success: true, gallery }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/gallery]", error);
    return NextResponse.json(
      { success: false, error: "Failed to create gallery" },
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
    const { id, images, ...updateDataRaw } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Gallery ID is required" },
        { status: 400 }
      );
    }
    
    const updatePayload: any = { ...updateDataRaw };
    delete updatePayload._id;
    if (updatePayload.albumName !== undefined) updatePayload.album_name = updatePayload.albumName;
    if (updatePayload.eventDate !== undefined) updatePayload.event_date = updatePayload.eventDate ? new Date(updatePayload.eventDate).toISOString().split('T')[0] : null;
    if (updatePayload.eventLocation !== undefined) updatePayload.event_location = updatePayload.eventLocation;
    if (updatePayload.isPublished !== undefined) updatePayload.is_published = updatePayload.isPublished;
    delete updatePayload.albumName;
    delete updatePayload.eventDate;
    delete updatePayload.eventLocation;
    delete updatePayload.isPublished;
    delete updatePayload.createdAt;
    delete updatePayload.updatedAt;

    const repo = new GalleryAlbumRepository();
    const updatedAlbum = await repo.update(id, updatePayload);

    if (!updatedAlbum) {
      return NextResponse.json(
        { success: false, error: "Gallery not found" },
        { status: 404 }
      );
    }
    
    if (images && Array.isArray(images)) {
        // Simple sync: delete old images and insert new ones
        await repo.getClient().from('gallery_images').delete().eq('album_id', id);
        if (images.length > 0) {
            const imageInserts = images.map((img: any) => ({
                album_id: id,
                url: img.url,
                type: img.type || 'image',
                caption: img.caption,
                uploaded_by: img.uploadedBy?.id || img.uploadedBy?._id || user.id,
                likes: img.likes || 0
            }));
            await repo.getClient().from('gallery_images').insert(imageInserts);
        }
    }
    
    // fetch full updated object to return
    const { data: rawGalleries } = await repo.getClient().from('gallery_albums')
        .select('*, images:gallery_images(*)')
        .eq('id', id);

    let gallery = { _id: updatedAlbum.id, id: updatedAlbum.id, ...updatedAlbum };
    if (rawGalleries && rawGalleries.length > 0) {
        const g = rawGalleries[0];
        gallery = {
            _id: g.id,
            id: g.id,
            title: g.title,
            description: g.description,
            albumName: g.album_name,
            category: g.category,
            eventDate: g.event_date,
            eventLocation: g.event_location,
            visibility: g.visibility,
            isPublished: g.is_published,
            featured: g.featured,
            createdAt: g.created_at,
            updatedAt: g.updated_at,
            images: g.images.map((img: any) => ({
                _id: img.id,
                id: img.id,
                url: img.url,
                type: img.type,
                caption: img.caption,
                likes: img.likes,
            }))
        };
    }

    return NextResponse.json({ success: true, gallery });
  } catch (error) {
    console.error("[PUT /api/gallery]", error);
    return NextResponse.json(
      { success: false, error: "Failed to update gallery" },
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
        { success: false, error: "Gallery ID is required" },
        { status: 400 }
      );
    }

    const repo = new GalleryAlbumRepository();
    const gallery = await repo.delete(id);

    return NextResponse.json({ success: true, message: "Gallery deleted successfully" });
  } catch (error) {
    console.error("[DELETE /api/gallery]", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete gallery" },
      { status: 500 }
    );
  }
}
