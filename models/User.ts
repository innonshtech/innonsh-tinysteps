import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: {
    type: String,
    enum: ["admin", "teacher", "parent", "student"],
    default: "admin"
  },
  // Link to Student record if role is student
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
  // Link to Parent record if role is parent
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: "Parent" },
});

export default mongoose.models.User || mongoose.model("User", userSchema);
