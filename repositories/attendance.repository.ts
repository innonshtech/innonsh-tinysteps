import { BaseRepository } from './base.repository';

export interface Attendance {
  id: string;
  school_id: string;
  student_id: string;
  class_id?: string;
  date: Date;
  status: string;
  marked_by_teacher_id?: string;
  marked_by_user_id?: string;
  notes?: string;
  created_at: Date;
  updated_at: Date;
  // Related
  students?: any;
  classes?: any;
  teachers?: any;
  users?: any;
  student?: any;
  class?: any;
  teacher?: any;
  user?: any;
}

export class AttendanceRepository extends BaseRepository<Attendance> {
  constructor() {
    super('attendance');
  }

  async findWithRelations(query: Record<string, any> = {}, options: any = {}): Promise<{ data: Attendance[], total: number }> {
    let queryBuilder = this.getClient()
      .from(this.tableName)
      .select(`
        *,
        student:students(*),
        class:classes(*),
        teacher:teachers(*),
        user:users(*)
      `, { count: 'exact' });

    if (query.startDate && query.endDate) {
      queryBuilder = queryBuilder.gte('date', query.startDate).lte('date', query.endDate);
    }
    
    // Process remaining standard equal/in queries
    for (const [key, value] of Object.entries(query)) {
      if (['startDate', 'endDate'].includes(key)) continue;
      
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
    
    return { data: data as Attendance[], total: count || 0 };
  }
}
