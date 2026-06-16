import mongoose from "mongoose";

/**
 * FCM Notification Categories — maps to ERP notification types.
 * Used to set the correct notification channel on Android.
 */
export const FCM_CATEGORIES = [
  "holiday",
  "sports",
  "academic",
  "exam",
  "fee_reminder",
  "circular",
  "emergency",
  "attendance",
  "general",
] as const;

const NotificationSchema = new mongoose.Schema(
  {
    recipientId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // User receiving notification
    type: {
      type: String,
      enum: ["event", "announcement", "fee", "attendance", "exam", "transport", "meal", "system", "leave", "emergency", "circular", "sports", "holiday", "academic"],
      required: true,
    },
    // FCM-specific category used for Android notification channels
    fcmCategory: {
      type: String,
      enum: FCM_CATEGORIES,
      default: "general",
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    relatedId: { type: mongoose.Schema.Types.ObjectId }, // ID of related resource (exam, event, etc)
    relatedModel: String, // Model name (Exam, Event, etc)
    isRead: { type: Boolean, default: false },
    readAt: Date,
    priority: { type: String, enum: ["low", "normal", "high", "urgent"], default: "normal" },
    actionUrl: String, // Deep link / URL to navigate to on tap
    icon: String, // icon name for UI
    metadata: mongoose.Schema.Types.Mixed, // additional data (event details, etc)
    // FCM push delivery tracking
    fcmSent: { type: Boolean, default: false },
    fcmSentAt: { type: Date },
  },
  { timestamps: true }
);

// Index for efficient unread queries per user
NotificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });

delete mongoose.models.Notification;
export default mongoose.models.Notification || mongoose.model("Notification", NotificationSchema);
