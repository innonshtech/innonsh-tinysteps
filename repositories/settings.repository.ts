import { BaseRepository } from "./base.repository";

export class SettingsRepository extends BaseRepository {
  constructor() {
    super('school_settings');
  }
}
