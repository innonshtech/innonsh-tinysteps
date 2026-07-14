import { BaseRepository } from "./base.repository";

export class LeaveRepository extends BaseRepository {
  constructor() {
    super('teacher_leaves');
  }
}

export class SubstituteAssignmentRepository extends BaseRepository {
  constructor() {
    super('substitute_assignments');
  }
}
