import mongoose from "mongoose";

/**
 * NotificationDeliveryLog — tracks every FCM push attempt.
 * Created when a push is dispatched; updated when delivered/clicked.
 * Used for analytics, retry logic, and debugging.
 */
const NotificationDeliveryLogSchema = new mongoose.Schema(
  {
    notificationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Notification",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    fcmToken: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "sent", "delivered", "failed", "clicked"],
      default: "pending",
    },
    // FCM message ID returned by Firebase on success
    fcmMessageId: {
      type: String,
    },
    // Firebase error code (e.g. messaging/registration-token-not-registered)
    errorCode: {
      type: String,
    },
    errorMessage: {
      type: String,
    },
    sentAt: {
      type: Date,
    },
    deliveredAt: {
      type: Date,
    },
    clickedAt: {
      type: Date,
    },
    // How many times we retried after failure
    retryCount: {
      type: Number,
      default: 0,
    },
    // Next retry time (null = no retry scheduled)
    nextRetryAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Efficiently retrieve all delivery records for a notification (admin view)
NotificationDeliveryLogSchema.index({ notificationId: 1 });
// Per-user delivery history
NotificationDeliveryLogSchema.index({ userId: 1, status: 1 });
// Retry queue: find failed logs that need retry
NotificationDeliveryLogSchema.index({ status: 1, retryCount: 1, nextRetryAt: 1 });

export default mongoose.models.NotificationDeliveryLog ||
  mongoose.model("NotificationDeliveryLog", NotificationDeliveryLogSchema);
