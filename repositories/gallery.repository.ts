import { BaseRepository } from "./base.repository";

export class GalleryAlbumRepository extends BaseRepository {
  constructor() {
    super('gallery_albums');
  }
}

export class GalleryImageRepository extends BaseRepository {
  constructor() {
    super('gallery_images');
  }
}

export class GalleryImageCommentRepository extends BaseRepository {
  constructor() {
    super('gallery_image_comments');
  }
}
