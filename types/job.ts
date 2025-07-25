export interface JobApplication {
  id: string;
  company: string;
  role: string;
  salaryRange: {
    min?: string;
    max?: string;
    currency?: string;
  };
  workLocation: string;
  jobType: "full-time" | "part-time" | "contract" | "freelance" | "internship";
  workMode: "remote" | "on-site" | "hybrid";
  status: "applied" | "shortlisted" | "interview" | "rejected" | "offered";
  interviewLink?: string;
  appliedDate: string;
  notes?: string;
  category?: string; // e.g., "Software Engineering", "Marketing", "Design"
  experienceLevel?: "entry" | "mid" | "senior" | "lead" | "executive";
  jobPostingUrl?: string;
  // New fields for enhanced features
  interviewDate?: string;
  statusHistory?: StatusHistoryEntry[];
  contacts?: Contact[];
  documents?: Document[];
  followUpDate?: string;
  priority?: "low" | "medium" | "high";
  archived?: boolean;
}

export interface StatusHistoryEntry {
  id: string;
  status: JobStatus;
  date: string;
  notes?: string;
}

export interface Contact {
  id: string;
  name: string;
  title?: string;
  email?: string;
  phone?: string;
  linkedIn?: string;
  type: "recruiter" | "hiring-manager" | "team-member" | "other";
}

export interface Document {
  id: string;
  name: string;
  type: "resume" | "cover-letter" | "portfolio" | "other";
  url?: string;
  uploadDate: string;
  fileSize?: number;
  mimeType?: string;
  content?: string; // Base64 encoded content for local storage
  jobId?: string; // Link to specific job application
}

export type JobStatus = JobApplication["status"];
export type JobType = JobApplication["jobType"];
export type WorkMode = JobApplication["workMode"];
export type ExperienceLevel = JobApplication["experienceLevel"];
export type Priority = JobApplication["priority"];

export interface FilterOptions {
  status?: JobStatus | "all";
  jobType?: JobType | "all";
  workMode?: WorkMode | "all";
  experienceLevel?: ExperienceLevel | "all";
  category?: string;
  priority?: Priority | "all";
  dateRange?: {
    start: string;
    end: string;
  };
  salaryRange?: {
    min: number;
    max: number;
  };
  hasInterview?: boolean;
  location?: string;
}

export interface FilterPreset {
  id: string;
  name: string;
  filters: FilterOptions;
  sort: SortOptions;
  createdDate: string;
}

export interface SortOptions {
  field:
    | "appliedDate"
    | "company"
    | "role"
    | "status"
    | "interviewDate"
    | "priority";
  order: "asc" | "desc";
}
