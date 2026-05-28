import { z } from "zod";

export const ParentZ = z.object({
  name: z.string().min(1),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  relation: z.string().optional(),
});

export const StudentCreateZ = z.object({
  firstName: z.string().min(1),
  lastName: z.string().optional(),
  email: z.string().email().optional(),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
  dob: z.string().optional(), // ISO string
  gender: z.enum(["male", "female", "other"]).optional(),
  classId: z.string().optional(),
  section: z.string().optional(),
  admissionNo: z.string().optional(),
  admissionDate: z.string().optional(),
  parents: z.array(ParentZ).optional(),
  medical: z
    .object({
      allergies: z.array(z.string()).optional(),
      notes: z.string().optional(),
    })
    .optional(),
  pickupInfo: z
    .object({
      pickupPerson: z.string().optional(),
      pickupPhone: z.string().optional(),
    })
    .optional(),
  documents: z.array(z.object({ name: z.string(), url: z.string() })).optional(),
});
