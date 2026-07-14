import { BaseRepository } from "./base.repository";

export class EventRepository extends BaseRepository {
  constructor() {
    super('events');
  }
}

export class EventAttachmentRepository extends BaseRepository {
  constructor() {
    super('event_attachments');
  }
}

export class EventClassTargetRepository extends BaseRepository {
  constructor() {
    super('event_class_targets');
  }
}
