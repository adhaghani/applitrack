import { z } from "zod";

export const jobApplicationSchema = z.object({
  company: z.string().min(1, "Company name is required"),
  role: z.string().min(1, "Job role is required"),
  workLocation: z.string().min(1, "Work location is required"),
  salaryRange: z.object({
    min: z.string().optional(),
    max: z.string().optional(),
    currency: z.string().optional(),
  }),
  jobType: z.enum([
    "full-time",
    "part-time",
    "contract",
    "freelance",
    "internship",
  ]),
  workMode: z.enum(["remote", "on-site", "hybrid"]),
  status: z.enum([
    "applied",
    "shortlisted",
    "interview",
    "rejected",
    "offered",
  ]),
  experienceLevel: z
    .enum(["entry", "mid", "senior", "lead", "executive"])
    .optional(),
  category: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  interviewDate: z.string().optional(),
  followUpDate: z.string().optional(),
  jobPostingUrl: z
    .string()
    .url("Please enter a valid URL")
    .optional()
    .or(z.literal("")),
  interviewLink: z
    .string()
    .url("Please enter a valid URL")
    .optional()
    .or(z.literal("")),
  notes: z.string().optional(),
});

export type JobApplicationFormData = z.infer<typeof jobApplicationSchema>;
