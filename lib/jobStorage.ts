import { JobApplication, StatusHistoryEntry } from "@/types/job";

const STORAGE_KEY = "job-applications";
const STORAGE_VERSION = "2.0";

// Enhanced migration function to handle old data structure and add new fields
const migrateJobApplication = (job: any): JobApplication => {
  // If it's already the new format, return as is
  if (job.salaryRange && job.workLocation && job.jobType && job.workMode) {
    return {
      ...job,
      statusHistory: job.statusHistory || [
        {
          id: crypto.randomUUID(),
          status: job.status,
          date: job.appliedDate + "T00:00:00.000Z",
          notes: "Migrated from old format",
        },
      ],
      contacts: job.contacts || [],
      documents: job.documents || [],
      priority: job.priority || "medium",
      archived: job.archived || false,
      interviewDate: job.interviewDate || undefined,
      followUpDate: job.followUpDate || undefined,
    };
  }

  // Migrate from old format
  return {
    ...job,
    salaryRange: {
      min: job.expectedSalary ? job.expectedSalary.split("-")[0]?.trim() : "",
      max: job.expectedSalary ? job.expectedSalary.split("-")[1]?.trim() : "",
      currency: "USD",
    },
    workLocation: job.workLocation || "Not specified",
    jobType: job.jobType || "full-time",
    workMode: job.workMode || "on-site",
    category: job.category || "",
    experienceLevel: job.experienceLevel || "mid",
    jobPostingUrl: job.jobPostingUrl || "",
    statusHistory: [
      {
        id: crypto.randomUUID(),
        status: job.status,
        date: job.appliedDate + "T00:00:00.000Z",
        notes: "Migrated from old format",
      },
    ],
    contacts: [],
    documents: [],
    priority: "medium",
    archived: false,
  };
};

export const jobStorage = {
  getAll: (): JobApplication[] => {
    if (typeof window === "undefined") return [];

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const jobs = stored ? JSON.parse(stored) : [];
      // Migrate all jobs to new format
      return jobs.map(migrateJobApplication);
    } catch (error) {
      console.error("Error loading job applications:", error);
      return [];
    }
  },

  save: (applications: JobApplication[]): void => {
    if (typeof window === "undefined") return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(applications));
    } catch (error) {
      console.error("Error saving job applications:", error);
    }
  },

  add: (application: Omit<JobApplication, "id">): JobApplication => {
    console.log("jobStorage.add called with:", application);

    const newApplication: JobApplication = {
      ...application,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      statusHistory: [
        {
          id: crypto.randomUUID(),
          status: application.status,
          date: new Date().toISOString(),
          notes: "Application created",
        },
      ],
      contacts: application.contacts || [],
      documents: application.documents || [],
      archived: false,
    };

    console.log("Created new application:", newApplication);

    const applications = jobStorage.getAll();
    applications.push(newApplication);
    jobStorage.save(applications);

    console.log(
      "Saved applications to storage, total count:",
      applications.length
    );

    return newApplication;
  },

  update: (id: string, updates: Partial<JobApplication>): void => {
    const applications = jobStorage.getAll();
    const index = applications.findIndex((app) => app.id === id);

    if (index !== -1) {
      const oldApp = applications[index];
      const updatedApp = { ...oldApp, ...updates };

      // If status changed, add to status history
      if (updates.status && updates.status !== oldApp.status) {
        const statusHistory = oldApp.statusHistory || [];
        statusHistory.push({
          id: crypto.randomUUID(),
          status: updates.status,
          date: new Date().toISOString(),
          notes: `Status changed from ${oldApp.status} to ${updates.status}`,
        });
        updatedApp.statusHistory = statusHistory;
      }

      applications[index] = updatedApp;
      jobStorage.save(applications);
    }
  },

  delete: (id: string): void => {
    const applications = jobStorage.getAll();
    const filtered = applications.filter((app) => app.id !== id);
    jobStorage.save(filtered);
  },

  archive: (id: string): void => {
    jobStorage.update(id, { archived: true });
  },

  unarchive: (id: string): void => {
    jobStorage.update(id, { archived: false });
  },

  // Export/Import functionality
  exportData: (): string => {
    const applications = jobStorage.getAll();
    return JSON.stringify(
      {
        version: STORAGE_VERSION,
        exportDate: new Date().toISOString(),
        applications,
      },
      null,
      2
    );
  },

  importData: (
    jsonData: string
  ): { success: boolean; message: string; imported: number } => {
    try {
      const data = JSON.parse(jsonData);

      if (!data.applications || !Array.isArray(data.applications)) {
        return { success: false, message: "Invalid data format", imported: 0 };
      }

      const migratedApps = data.applications.map(migrateJobApplication);
      jobStorage.save(migratedApps);

      return {
        success: true,
        message: "Data imported successfully",
        imported: migratedApps.length,
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to parse import data",
        imported: 0,
      };
    }
  },
};
