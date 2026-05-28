import { z } from "zod";

export const TimetableCreateZ = z.object({
  classId: z.string(),
  day: z.string(),
  subject: z.string(),
  teacherId: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  roomNumber: z.string().optional(),
});
