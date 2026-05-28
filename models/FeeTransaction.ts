import mongoose from "mongoose";

const FeeTransactionSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // optional
  structureId: { type: mongoose.Schema.Types.ObjectId, ref: "FeeStructure" },
  items: [
    {
      head: String,
      amount: Number,
    }
  ],
  amountDue: { type: Number, required: true },
  amountPaid: { type: Number, default: 0 },
  fineAmount: { type: Number, default: 0 },
  status: { type: String, enum: ["due", "partial", "paid"], default: "due" },
  dueDate: Date,
  paymentMethod: { type: String, enum: ["cash", "razorpay", "online", "offline"], default: "cash" },
  paymentMeta: mongoose.Schema.Types.Mixed, // store Razorpay order/payment info
  receipts: [{ url: String, createdAt: Date }],
  note: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" } // who collected
}, { timestamps: true });

export default mongoose.models.FeeTransaction || mongoose.model("FeeTransaction", FeeTransactionSchema);
