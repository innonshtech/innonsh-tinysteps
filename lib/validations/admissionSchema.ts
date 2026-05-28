// lib/validations/admissionSchema.ts
import { z } from "zod";

export const InquiryZ = z.object({
  parentName: z.string().min(1),
  parentEmail: z.string().email().optional(),
  parentPhone: z.string().optional(),
  childName: z.string().optional(),
  childDob: z.string().optional(),
  preferredClass: z.string().optional(),
  message: z.string().optional(),
  source: z.string().optional(),
});

export const AdmissionApplyZ = z.object({
  childFirstName: z.string().min(1),
  childLastName: z.string().optional(),
  dob: z.string().optional(),
  gender: z.enum(["male","female","other"]).optional(),
  preferredClass: z.string().optional(),
  parents: z.array(
    z.object({
      parentId: z.string().optional(),
      name: z.string().min(1),
      phone: z.string().optional(),
      email: z.string().optional(),
      relation: z.string().optional()
    })
  ).min(1),
  previousSchool: z.string().optional(),
  documents: z.array(z.object({ name: z.string(), url: z.string() })).optional()
});
