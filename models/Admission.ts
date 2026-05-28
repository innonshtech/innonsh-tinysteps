// models/Admission.ts
import mongoose from "mongoose";

const DocumentSchema = new mongoose.Schema({
  name: String,
  url: String,
  verified: { type: Boolean, default: false }
}, { _id: false });

const ParentRefSchema = new mongoose.Schema({
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  name: String,
  phone: String,
  email: String,
  relation: String
}, { _id: false });

const AdmissionSchema = new mongoose.Schema(
  {
    admissionNo: { type: String, index: true, unique: true, sparse: true },
    childFirstName: { type: String, required: true },
    childLastName: String,
    dob: Date,
    gender: String,
    preferredClass: String,
    appliedByParentId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // optional if submitted by admin
    parents: [ParentRefSchema],
    previousSchool: String,
    documents: [DocumentSchema],
    status: { type: String, enum: ["submitted","pending","approved","rejected","enrolled"], default: "submitted" },
    adminNote: String,
    admissionFeePaid: { type: Boolean, default: false },
    convertedStudentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student" }
  },
  { timestamps: true }
);

export default mongoose.models.Admission || mongoose.model("Admission", AdmissionSchema);
