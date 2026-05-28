import mongoose from "mongoose";

const TimetableSchema = new mongoose.Schema(
  {
    classId: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true },
    day: { type: String, required: true }, // Monday, Tuesday, ...
    subject: { type: String, required: true },
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher", required: true },

    startTime: { type: String, required: true }, // "09:00"
    endTime: { type: String, required: true },   // "09:45"

    roomNumber: String,
  },
  { timestamps: true }
);

export default mongoose.models.Timetable || mongoose.model("Timetable", TimetableSchema);
