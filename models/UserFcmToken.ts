import mongoose from "mongoose";

/**
 * UserFcmToken — stores FCM device tokens per user.
 * One user can have multiple tokens (multiple devices).
 * Tokens are deactivated (not deleted) when:
 * - User logs out
 * - Firebase returns InvalidRegistration / NotRegistered error
 * - Token is refreshed (old token deactivated, new token saved)
 */
const UserFcmTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
    },
    platform: {
      type: String,
      enum: ["android", "ios"],
      default: "android",
    },
    deviceId: {
      type: String, // unique device identifier for dedup
    },
    appVersion: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Compound index: fetch all active tokens for a user quickly
UserFcmTokenSchema.index({ userId: 1, isActive: 1 });
// Unique token index (already covered by unique: true above)
UserFcmTokenSchema.index({ token: 1 });
// For cleanup jobs: find stale tokens
UserFcmTokenSchema.index({ lastSeen: 1, isActive: 1 });

export default mongoose.models.UserFcmToken ||
  mongoose.model("UserFcmToken", UserFcmTokenSchema);
