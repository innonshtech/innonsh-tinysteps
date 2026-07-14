import { BaseRepository } from './base.repository';

export interface LogActivity {
  id: string;
  school_id?: string;
  actor_id?: string;
  actor_email?: string;
  actor_role?: string;
  action: string;
  result: string;
  message?: string;
  ip?: string;
  user_agent?: string;
  metadata?: any;
  created_at: Date;
  updated_at: Date;
}

export class LogActivityRepository extends BaseRepository<LogActivity> {
  constructor() {
    super('log_activities');
  }
}
