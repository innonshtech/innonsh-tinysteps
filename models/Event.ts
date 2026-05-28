import mongoose from "mongoose";

const EventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: String,
    eventType: { type: String, enum: ["meeting", "holiday", "celebration", "workshop", "competition", "notification"], default: "notification" },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    startTime: String, // "09:00"
    endTime: String,   // "11:00"
    location: String,
    image: String, // image URL
    targetAudience: { type: String, enum: ["all", "parents", "students", "teachers", "staff"], default: "all" },
    classIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Class" }], // specific classes if applicable
    attachments: [
      {
        name: String,
        url: String,
      }
    ],
    status: { type: String, enum: ["draft", "published", "archived"], default: "draft" },
    notify: { type: Boolean, default: true },
    notificationType: { type: String, enum: ["email", "sms", "in-app", "all"], default: "all" },
  },
  { timestamps: true }
);

export default mongoose.models.Event || mongoose.model("Event", EventSchema);
