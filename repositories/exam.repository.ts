import { BaseRepository } from "./base.repository";

export class ExamRepository extends BaseRepository {
  constructor() {
    super('exams');
  }
}

export class ExamScheduleRepository extends BaseRepository {
  constructor() {
    super('exam_schedule');
  }
}

export class ExamResultRepository extends BaseRepository {
  constructor() {
    super('exam_results');
  }
}

export class AssessmentRepository extends BaseRepository {
  constructor() {
    super('assessments');
  }
}
