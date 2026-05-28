// models/Inquiry.ts
import mongoose from "mongoose";

const InquirySchema = new mongoose.Schema(
  {
    parentName: { type: String, required: true },
    parentEmail: String,
    parentPhone: String,
    childName: String,
    childDob: Date,
    preferredClass: String,
    message: String,
    source: String, // e.g., "website", "walk-in"
    status: { type: String, enum: ["new","contacted","converted","closed"], default: "new" },
    meta: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

export default mongoose.models.Inquiry || mongoose.model("Inquiry", InquirySchema);
