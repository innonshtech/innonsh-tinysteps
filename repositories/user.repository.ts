import { BaseRepository } from './base.repository';

export interface User {
  id: string;
  school_id: string;
  name: string;
  email: string;
  password?: string;
  role: string;
  created_at: Date;
  updated_at: Date;
}

export class UserRepository extends BaseRepository<User> {
  constructor() {
    super('users');
  }

  async findByEmail(email: string): Promise<User | null> {
    const { data, error } = await this.getClient()
      .from(this.tableName)
      .select('*')
      .eq('email', email)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    return data as User | null;
  }
}
