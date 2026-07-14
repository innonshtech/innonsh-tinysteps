import { BaseRepository } from "./base.repository";

export class UserFcmTokenRepository extends BaseRepository {
  constructor() {
    super('user_fcm_tokens');
  }
}
