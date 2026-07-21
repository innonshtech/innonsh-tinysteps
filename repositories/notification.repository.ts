import { BaseRepository } from "./base.repository";

export class NotificationRepository extends BaseRepository {
  constructor() {
    super('notifications');
  }

  async markAsRead(id: string) {
    return this.update(id, {
      is_read: true,
      read_at: new Date().toISOString()
    });
  }
  
  async markAllAsRead(recipientId: string) {
      const { data, error } = await this.getClient()
          .from(this.tableName)
          .update({ is_read: true, read_at: new Date().toISOString() })
          .eq('recipient_id', recipientId)
          .eq('is_read', false)
          .select();
          
      if (error) throw error;
      return data;
  }
}

export class NotificationDeliveryLogRepository extends BaseRepository {
    constructor() {
        super('notification_delivery_logs');
    }
}
