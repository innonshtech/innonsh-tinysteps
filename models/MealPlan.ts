import mongoose from "mongoose";

const MealPlanSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // e.g., "Weekly Plan", "Monthly Plan"
    description: String,
    startDate: { type: Date, required: true },
    endDate: Date,
    mealType: { type: String, enum: ["breakfast", "lunch", "snacks", "full-day"], default: "lunch" },
    weeklySchedule: [
      {
        day: { type: String, enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] },
        items: [
          {
            name: String, // e.g., "Khichdi", "Fruits"
            quantity: String, // e.g., "200g", "2 pieces"
            nutritionInfo: String, // e.g., "Protein: 5g, Carbs: 30g"
            allergens: [String], // e.g., ["peanut", "dairy"]
            imageUrl: String,
          }
        ],
      }
    ],
    specialMeals: [
      {
        date: Date,
        occasion: String, // e.g., "Birthday", "Festival"
        items: [String],
      }
    ],
    classIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Class" }], // applicable for specific classes
    cost: Number, // daily cost per student
    vendor: String, // catering company/vendor name
    vendorContact: String,
    status: { type: String, enum: ["draft", "active", "inactive"], default: "draft" },
  },
  { timestamps: true }
);

export default mongoose.models.MealPlan || mongoose.model("MealPlan", MealPlanSchema);
