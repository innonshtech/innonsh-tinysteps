import { z } from "zod";

export const ClassCreateZ = z.object({
  name: z.string().min(1),
  section: z.string().min(1),
  roomNumber: z.string().optional(),
  teachers: z.array(z.string()).optional(),
  students: z.array(z.string()).optional(),
});
