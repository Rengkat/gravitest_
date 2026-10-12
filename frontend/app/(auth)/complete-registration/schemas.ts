import { z } from "zod";

// ─── STEP 1: PERSONAL INFORMATION ───────────────────────────
export const personalInfoSchema = z.object({
  firstName: z
    .string()
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name is too long")
    .regex(/^[a-zA-Z\s'-]+$/, "First name can only contain letters, hyphens, and apostrophes"),

  lastName: z
    .string()
    .min(2, "Last name must be at least 2 characters")
    .max(50, "Last name is too long")
    .regex(/^[a-zA-Z\s'-]+$/, "Last name can only contain letters, hyphens, and apostrophes"),

  dateOfBirth: z
    .string()
    .min(1, "Date of birth is required")
    .refine((val) => {
      const date = new Date(val);
      const now = new Date();
      const age = now.getFullYear() - date.getFullYear();
      return age >= 10 && age <= 60;
    }, "You must be between 10 and 60 years old"),

  gender: z.enum(["male", "female"], {
    message: "Please select a gender",
  }),

  phoneNumber: z
    .string()
    .min(1, "Phone number is required")
    .regex(
      /^(\+234|0)(7|8|9)(0|1)\d{8}$/,
      "Enter a valid Nigerian phone number (e.g. 08012345678)",
    ),

  stateOfResidence: z.string().min(1, "Please select your state"),

  lga: z.string().min(2, "LGA must be at least 2 characters").max(80, "LGA name is too long"),
});

// ─── STEP 2: ACADEMIC INFORMATION ───────────────────────────
export const academicInfoSchema = z.object({
  currentSchool: z
    .string()
    .min(3, "School name must be at least 3 characters")
    .max(120, "School name is too long"),

  currentClass: z.string().min(1, "Please select your current class"),

  graduationYear: z
    .string()
    .min(1, "Please select your graduation year")
    .refine((val) => {
      const year = parseInt(val);
      const now = new Date().getFullYear();
      return year >= now && year <= now + 10;
    }, "Please select a valid graduation year"),

  focusSubjects: z
    .array(z.string())
    .min(1, "Select at least one subject")
    .max(6, "You can select up to 6 subjects"),
});

// ─── STEP 3: EXAM GOALS ─────────────────────────────────────
export const examGoalsSchema = z.object({
  examTargets: z.array(z.string()).min(1, "Select at least one exam target"),

  targetScore: z
    .string()
    .min(1, "Target score is required")
    .refine((val) => {
      const n = parseInt(val);
      return !isNaN(n) && n >= 1 && n <= 400;
    }, "Enter a score between 1 and 400"),

  targetCourse: z
    .string()
    .min(3, "Target course must be at least 3 characters")
    .max(120, "Course name is too long"),
});

// ─── COMBINED (for final submission) ────────────────────────
export const fullRegistrationSchema = personalInfoSchema
  .merge(academicInfoSchema)
  .merge(examGoalsSchema);

// ─── INFERRED TYPES ──────────────────────────────────────────
export type PersonalInfoData = z.infer<typeof personalInfoSchema>;
export type AcademicInfoData = z.infer<typeof academicInfoSchema>;
export type ExamGoalsData = z.infer<typeof examGoalsSchema>;
export type FullRegistration = z.infer<typeof fullRegistrationSchema>;
