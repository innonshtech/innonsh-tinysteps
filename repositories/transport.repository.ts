import { BaseRepository } from "./base.repository";

export class TransportRouteRepository extends BaseRepository {
  constructor() {
    super('transport_routes');
  }
}

export class TransportStopRepository extends BaseRepository {
  constructor() {
    super('transport_stops');
  }
}

export class TransportStudentAssignmentRepository extends BaseRepository {
  constructor() {
    super('transport_student_assignments');
  }
}
