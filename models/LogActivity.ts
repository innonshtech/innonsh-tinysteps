import mongoose from "mongoose";

const LogActivitySchema = new mongoose.Schema(
  {
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    actorEmail: String,
    actorRole: String,
    action: { type: String, required: true },
    result: { type: String, enum: ["success", "failure"], required: true },
    message: String,
    ip: String,
    userAgent: String,
    metadata: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

export default mongoose.models.LogActivity || mongoose.model("LogActivity", LogActivitySchema);
