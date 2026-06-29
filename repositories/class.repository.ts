import { BaseRepository } from './base.repository';

export interface ClassDoc {
  id: string;
  school_id: string;
  name: string;
  section: string;
  room_number?: string;
  created_at: Date;
  updated_at: Date;
}

export class ClassRepository extends BaseRepository<ClassDoc> {
  constructor() {
    super('classes');
  }
}
