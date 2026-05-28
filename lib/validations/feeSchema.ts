import { z } from "zod";

export const FeeHeadZ = z.object({
  title: z.string().min(1),
  amount: z.number().nonnegative(),
  frequency: z.enum(["monthly", "quarterly", "yearly", "one-time"]).optional(),
  dueDateDay: z.number().int().min(1).max(31).optional(),
});

export const FeeStructureCreateZ = z.object({
  name: z.string().min(1),
  classId: z.string().optional().transform(val => val === "" ? undefined : val),
  heads: z.array(FeeHeadZ).min(1),
  finePerDay: z.number().nonnegative().optional(),
  description: z.string().optional(),
  active: z.boolean().optional(),
});

export const FeeCollectZ = z.object({
  studentId: z.string(),
  structureId: z.string().optional(),
  items: z.array(z.object({ head: z.string(), amount: z.number().nonnegative() })).optional(),
  amount: z.number().nonnegative(),
  paymentMethod: z.enum(["cash", "razorpay", "online", "offline"]).optional(),
  paymentMeta: z.any().optional(),
  note: z.string().optional(),
  partial: z.boolean().optional(), // true if partial payment
});
