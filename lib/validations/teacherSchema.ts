import { z } from "zod";

export const TeacherCreateZ = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().optional(),
  subjects: z.array(z.string()).optional(),
  classes: z.array(z.object({ classId: z.string(), section: z.string().optional() })).optional(),
  qualifications: z.array(z.string()).optional(),
});

export const AttendanceMarkZ = z.object({
  entries: z.array(
    z.object({
      studentId: z.string(),
      status: z.enum(["present", "absent", "late", "excused"]),
      notes: z.string().optional(),
    })
  ),
  date: z.string().optional(), // ISO date
  classId: z.string().optional(),
});

export const AssessmentCreateZ = z.object({
  studentId: z.string(),
  term: z.string().optional(),
  cognitive: z.string().optional(),
  motor: z.string().optional(),
  social: z.string().optional(),
  notes: z.string().optional(),
  score: z.any().optional(),
});
