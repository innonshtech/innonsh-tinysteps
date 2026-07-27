import { BaseRepository } from './base.repository';

export interface Student {
  id: string;
  school_id: string;
  first_name: string;
  last_name?: string;
  email?: string;
  password?: string;
  dob?: Date;
  gender?: string;
  class_id?: string | null;
  admission_no?: string;
  admission_date?: Date;
  medical_allergies?: string[];
  medical_notes?: string;
  pickup_person?: string;
  pickup_phone?: string;
  status?: string;
  created_at: Date;
  updated_at: Date;
  parents?: any[]; // Populated relation
  student_parents?: any[];
}

export class StudentRepository extends BaseRepository<Student> {
  constructor() {
    super('students');
  }

  async findWithParents(query: Record<string, any> = {}, options: any = {}): Promise<{ students: Student[], total: number }> {
    let queryBuilder = this.getClient()
      .from(this.tableName)
      .select(`
        *,
        class:classes(*),
        student_parents(*)
      `, { count: 'exact' });

    // Handle string matching (like Mongoose $regex)
    if (query.$or) {
      // Note: complex $or might require specific PostgREST syntax or rpc. 
      // For now, handling generic case if possible, or custom implementation.
      // E.g. "first_name.ilike.%query%,last_name.ilike.%query%"
      if (query.searchQuery) {
        queryBuilder = queryBuilder.or(`first_name.ilike.%${query.searchQuery}%,last_name.ilike.%${query.searchQuery}%,admission_no.ilike.%${query.searchQuery}%`);
      }
    }

    // Process remaining standard equal/in queries
    for (const [key, value] of Object.entries(query)) {
      if (key === '$or' || key === 'searchQuery') continue;

      if (typeof value === 'object' && value !== null && '$in' in value) {
        queryBuilder = queryBuilder.in(key, value.$in);
      } else {
        queryBuilder = queryBuilder.eq(key, value);
      }
    }

    if (options.sort) {
      queryBuilder = queryBuilder.order(options.sort.field, { ascending: options.sort.ascending });
    }

    if (options.limit) {
      const skip = options.skip || 0;
      queryBuilder = queryBuilder.range(skip, skip + options.limit - 1);
    }

    const { data, error, count } = await queryBuilder;

    if (error) throw error;

    return { students: data as Student[], total: count || 0 };
  }
  async findWithRelations(query: Record<string, any> = {}, options: any = {}): Promise<{ data: Student[], total: number }> {
    let queryBuilder = this.getClient()
      .from(this.tableName)
      .select(`
        *,
        class:classes(*),
        parents:student_parents(*)
      `, { count: 'exact' });

    for (const [key, value] of Object.entries(query)) {
      if (typeof value === 'object' && value !== null && '$in' in value) {
        queryBuilder = queryBuilder.in(key, value.$in);
      } else {
        queryBuilder = queryBuilder.eq(key, value);
      }
    }

    if (options.sort) {
      queryBuilder = queryBuilder.order(options.sort.field, { ascending: options.sort.ascending });
    }

    if (options.limit) {
      const skip = options.skip || 0;
      queryBuilder = queryBuilder.range(skip, skip + options.limit - 1);
    }

    const { data, error, count } = await queryBuilder;
    if (error) throw error;

    return { data: data as Student[], total: count || 0 };
  }
}
