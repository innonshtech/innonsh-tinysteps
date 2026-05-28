import mongoose from "mongoose";

const AssessmentSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher" },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: "Class" },
    term: String,
    cognitive: String,
    motor: String,
    social: String,
    notes: String,
    score: mongoose.Schema.Types.Mixed, // optional structured score
  },
  { timestamps: true }
);

export default mongoose.models.Assessment || mongoose.model("Assessment", AssessmentSchema);
