import mongoose from "mongoose";

const ClassSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },            // e.g. "Nursery", "KG1"
    section: { type: String, default: "A" },           // e.g. "A", "B"
    teachers: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Teacher" }
    ],
    students: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Student" }
    ],
    roomNumber: String,
  },
  { timestamps: true }
);

export default mongoose.models.Class || mongoose.model("Class", ClassSchema);
