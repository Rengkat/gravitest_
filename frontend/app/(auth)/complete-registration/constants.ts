import { User, GraduationCap, Target } from "lucide-react";

// ─── STEP DEFINITIONS ────────────────────────────────────────
export const REGISTRATION_STEPS = [
  { number: 1 as const, title: "Personal Info", icon: User },
  { number: 2 as const, title: "Academic Info", icon: GraduationCap },
  { number: 3 as const, title: "Exam Goals", icon: Target },
] as const;

export type StepNumber = (typeof REGISTRATION_STEPS)[number]["number"];

// ─── NIGERIAN STATES ─────────────────────────────────────────
export const NIGERIAN_STATES = [
  "Abia",
  "Adamawa",
  "Akwa Ibom",
  "Anambra",
  "Bauchi",
  "Bayelsa",
  "Benue",
  "Borno",
  "Cross River",
  "Delta",
  "Ebonyi",
  "Edo",
  "Ekiti",
  "Enugu",
  "Gombe",
  "Imo",
  "Jigawa",
  "Kaduna",
  "Kano",
  "Katsina",
  "Kebbi",
  "Kogi",
  "Kwara",
  "Lagos",
  "Nasarawa",
  "Niger",
  "Ogun",
  "Ondo",
  "Osun",
  "Oyo",
  "Plateau",
  "Rivers",
  "Sokoto",
  "Taraba",
  "Yobe",
  "Zamfara",
  "FCT Abuja",
] as const;

// ─── EXAM TYPES ──────────────────────────────────────────────
export const EXAM_TYPES = [
  {
    id: "jamb",
    label: "JAMB UTME",
    description: "Unified Tertiary Matriculation Examination",
    color: "#7c3aed",
  },
  {
    id: "waec",
    label: "WAEC SSCE",
    description: "West African Senior School Certificate",
    color: "#0284c7",
  },
  {
    id: "neco",
    label: "NECO SSCE",
    description: "National Exam Council Certificate",
    color: "#059669",
  },
  {
    id: "post-utme",
    label: "Post-UTME",
    description: "University entrance screening test",
    color: "#d97706",
  },
  {
    id: "ican",
    label: "ICAN",
    description: "Institute of Chartered Accountants of Nigeria",
    color: "#dc2626",
  },
  {
    id: "nmcn",
    label: "NMCN",
    description: "Nursing and Midwifery Council of Nigeria",
    color: "#0284c7",
  },
] as const;

// ─── SUBJECTS ────────────────────────────────────────────────
export const SUBJECTS = [
  "Mathematics",
  "English Language",
  "Physics",
  "Chemistry",
  "Biology",
  "Economics",
  "Government",
  "Literature in English",
  "History",
  "Geography",
  "Commerce",
  "Accounting",
  "Further Mathematics",
  "Civic Education",
  "Christian Religious Studies",
  "Islamic Religious Studies",
  "Agricultural Science",
  "Computer Science",
  "Technical Drawing",
  "Food & Nutrition",
  "French",
  "Yoruba",
  "Hausa",
  "Igbo",
] as const;

// ─── CLASSES ─────────────────────────────────────────────────
export const CLASSES = [
  "JSS1",
  "JSS2",
  "JSS3",
  "SS1",
  "SS2",
  "SS3",
  "100 Level",
  "200 Level",
  "300 Level",
  "400 Level",
  "Postgraduate",
] as const;

// ─── GRADUATION YEARS ────────────────────────────────────────
export const GRADUATION_YEARS = Array.from({ length: 10 }, (_, i) =>
  (new Date().getFullYear() + i).toString(),
);

// ─── SCORE PRESETS ───────────────────────────────────────────
export const SCORE_PRESETS = [
  { label: "300+", value: "300", exam: "jamb", description: "Top universities" },
  { label: "320+", value: "320", exam: "jamb", description: "Elite universities" },
  { label: "350+", value: "350", exam: "jamb", description: "Medicine / Law" },
  { label: "A1s", value: "90", exam: "waec", description: "Distinction in all" },
  { label: "7 A1s", value: "85", exam: "waec", description: "Strong passes" },
] as const;

// ─── POPULAR COURSES ─────────────────────────────────────────
export const POPULAR_COURSES = [
  "Medicine and Surgery",
  "Engineering (Electrical)",
  "Engineering (Civil)",
  "Computer Science",
  "Law",
  "Pharmacy",
  "Accounting",
  "Economics",
  "Architecture",
  "Mass Communication",
  "Nursing Science",
  "Business Administration",
] as const;
