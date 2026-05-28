import mongoose from "mongoose";

const FeeHeadSchema = new mongoose.Schema(
  {
    title: { type: String, required: true }, // e.g., "Tuition", "Activity"
    amount: { type: Number, required: true },
    frequency: { type: String, enum: ["monthly","quarterly","yearly","one-time"], default: "monthly" },
    dueDateDay: { type: Number, default: 1 } // day of month for due
  },
  { _id: false }
);

const FeeStructureSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g., "KG1 - 2025"
  classId: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: false },
  heads: [FeeHeadSchema],
  finePerDay: { type: Number, default: 0 }, // amount charged per day late
  description: String,
  active: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.models.FeeStructure || mongoose.model("FeeStructure", FeeStructureSchema);
