import { BaseRepository } from './base.repository';

export interface Teacher {
  id: string;
  school_id: string;
  name: string;
  email: string;
  password?: string;
  phone?: string;
  subjects?: string[];
  qualifications?: string[];
  created_at: Date;
  updated_at: Date;
}

export class TeacherRepository extends BaseRepository<Teacher> {
  constructor() {
    super('teachers');
  }

  async findByEmail(email: string): Promise<Teacher | null> {
    const { data, error } = await this.getClient()
      .from(this.tableName)
      .select('*')
      .eq('email', email)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    return data as Teacher | null;
  }
}
