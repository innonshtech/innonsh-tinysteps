import mongoose from "mongoose";

const TransportRouteSchema = new mongoose.Schema(
  {
    routeName: { type: String, required: true }, // e.g., "Route A", "North Route"
    routeCode: { type: String, unique: true, sparse: true },
    description: String,
    driverId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    driverName: String,
    driverPhone: String,
    vehicleNumber: String,
    vehicleType: { type: String, enum: ["bus", "van", "auto"], default: "bus" },
    capacity: Number,
    stops: [
      {
        stopName: String,
        location: String,
        pickupTime: String, // "07:30"
        dropTime: String,   // "15:30"
        sequence: Number,
        coordinates: {
          lat: Number,
          lng: Number,
        }
      }
    ],
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: "Student" }],
    status: { type: String, enum: ["active", "inactive", "maintenance"], default: "active" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.TransportRoute || mongoose.model("TransportRoute", TransportRouteSchema);
