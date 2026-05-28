import mongoose from "mongoose";

const ExamSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // e.g., "Mid-Term 2025", "Final Exam"
    description: String,
    classId: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true },
    subjects: [String], // e.g., ["Math", "English", "EVS"]
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    totalMarks: { type: Number, default: 100 },
    passingMarks: { type: Number, default: 35 },
    examType: { type: String, enum: ["unit-test", "mid-term", "final", "pre-board", "board"], default: "unit-test" },
    schedule: [
      {
        subject: String,
        date: Date,
        startTime: String, // "09:00"
        endTime: String,   // "11:00"
        roomNumber: String,
        instructions: String,
      }
    ],
    results: [
      {
        studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
        marksObtained: Number,
        percentage: Number,
        grade: String,
        status: { type: String, enum: ["pass", "fail", "pending"], default: "pending" },
        remarks: String,
      }
    ],
    status: { type: String, enum: ["scheduled", "ongoing", "completed"], default: "scheduled" },
    isPublished: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.Exam || mongoose.model("Exam", ExamSchema);
