import { BaseRepository } from "./base.repository";

export class AdmissionRepository extends BaseRepository {
  constructor() {
    super('admissions');
  }
}

export class AdmissionParentRepository extends BaseRepository {
  constructor() {
    super('admission_parents');
  }
}

export class AdmissionDocumentRepository extends BaseRepository {
  constructor() {
    super('admission_documents');
  }
}
