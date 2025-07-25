import { JobApplication } from "@/types/job";

export interface ExportOptions {
  format: "csv" | "json" | "pdf";
  includeArchived?: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
  fields?: string[];
}

export class DataExportService {
  static exportToCSV(jobs: JobApplication[]): string {
    const headers = [
      "Company",
      "Role",
      "Status",
      "Applied Date",
      "Work Location",
      "Job Type",
      "Work Mode",
      "Experience Level",
      "Category",
      "Salary Min",
      "Salary Max",
      "Currency",
      "Priority",
      "Interview Date",
      "Job Posting URL",
      "Interview Link",
      "Notes",
    ];

    const csvContent = [
      headers.join(","),
      ...jobs.map((job) =>
        [
          `"${job.company}"`,
          `"${job.role}"`,
          job.status,
          job.appliedDate,
          `"${job.workLocation}"`,
          job.jobType,
          job.workMode,
          job.experienceLevel || "",
          `"${job.category || ""}"`,
          job.salaryRange?.min || "",
          job.salaryRange?.max || "",
          job.salaryRange?.currency || "",
          job.priority || "",
          job.interviewDate || "",
          job.jobPostingUrl || "",
          job.interviewLink || "",
          `"${(job.notes || "").replace(/"/g, '""')}"`,
        ].join(",")
      ),
    ].join("\n");

    return csvContent;
  }

  static exportToJSON(jobs: JobApplication[]): string {
    return JSON.stringify(
      {
        exportDate: new Date().toISOString(),
        version: "1.0",
        jobs: jobs,
      },
      null,
      2
    );
  }

  static downloadFile(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();

    URL.revokeObjectURL(url);
  }

  static exportJobs(jobs: JobApplication[], options: ExportOptions) {
    let filteredJobs = jobs;

    // Filter by archived status
    if (!options.includeArchived) {
      filteredJobs = filteredJobs.filter((job) => !job.archived);
    }

    // Filter by date range
    if (options.dateRange) {
      const startDate = new Date(options.dateRange.start);
      const endDate = new Date(options.dateRange.end);
      filteredJobs = filteredJobs.filter((job) => {
        const jobDate = new Date(job.appliedDate);
        return jobDate >= startDate && jobDate <= endDate;
      });
    }

    const timestamp = new Date().toISOString().split("T")[0];

    switch (options.format) {
      case "csv":
        const csvContent = this.exportToCSV(filteredJobs);
        this.downloadFile(
          csvContent,
          `job-applications-${timestamp}.csv`,
          "text/csv"
        );
        break;

      case "json":
        const jsonContent = this.exportToJSON(filteredJobs);
        this.downloadFile(
          jsonContent,
          `job-applications-${timestamp}.json`,
          "application/json"
        );
        break;

      case "pdf":
        // For PDF, we'll create a simple text-based report
        const pdfContent = this.generatePDFContent(filteredJobs);
        this.downloadFile(
          pdfContent,
          `job-applications-${timestamp}.txt`,
          "text/plain"
        );
        break;
    }
  }

  static generatePDFContent(jobs: JobApplication[]): string {
    const lines = [
      "=== JOB APPLICATIONS REPORT ===",
      `Generated: ${new Date().toLocaleDateString()}`,
      `Total Applications: ${jobs.length}`,
      "",
      "=== SUMMARY ===",
      `Applied: ${jobs.filter((j) => j.status === "applied").length}`,
      `Shortlisted: ${jobs.filter((j) => j.status === "shortlisted").length}`,
      `Interview: ${jobs.filter((j) => j.status === "interview").length}`,
      `Offered: ${jobs.filter((j) => j.status === "offered").length}`,
      `Rejected: ${jobs.filter((j) => j.status === "rejected").length}`,
      "",
      "=== APPLICATIONS ===",
      "",
    ];

    jobs.forEach((job, index) => {
      lines.push(`${index + 1}. ${job.company} - ${job.role}`);
      lines.push(`   Status: ${job.status.toUpperCase()}`);
      lines.push(`   Applied: ${job.appliedDate}`);
      lines.push(`   Location: ${job.workLocation}`);
      if (job.salaryRange?.min || job.salaryRange?.max) {
        const min = job.salaryRange.min || "N/A";
        const max = job.salaryRange.max || "N/A";
        const currency = job.salaryRange.currency || "";
        lines.push(`   Salary: ${currency} ${min} - ${currency} ${max}`);
      }
      if (job.notes) {
        lines.push(`   Notes: ${job.notes}`);
      }
      lines.push("");
    });

    return lines.join("\n");
  }

  static async importFromJSON(file: File): Promise<JobApplication[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const data = JSON.parse(content);

          // Validate the structure
          if (data.jobs && Array.isArray(data.jobs)) {
            resolve(data.jobs);
          } else {
            reject(new Error("Invalid JSON format"));
          }
        } catch (error) {
          reject(new Error("Failed to parse JSON file"));
        }
      };

      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsText(file);
    });
  }

  static async importFromCSV(file: File): Promise<JobApplication[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const lines = content.split("\n");
          const headers = lines[0].split(",").map((h) => h.replace(/"/g, ""));

          const jobs: JobApplication[] = lines
            .slice(1)
            .filter((line) => line.trim())
            .map((line) => {
              const values = this.parseCSVLine(line);

              return {
                id: crypto.randomUUID(),
                company: values[0] || "",
                role: values[1] || "",
                status: (values[2] || "applied") as any,
                appliedDate:
                  values[3] || new Date().toISOString().split("T")[0],
                workLocation: values[4] || "",
                jobType: (values[5] || "full-time") as any,
                workMode: (values[6] || "on-site") as any,
                experienceLevel: values[7] as any,
                category: values[8],
                salaryRange: {
                  min: values[9],
                  max: values[10],
                  currency: values[11] || "USD",
                },
                priority: values[12] as any,
                interviewDate: values[13],
                jobPostingUrl: values[14],
                interviewLink: values[15],
                notes: values[16],
              };
            });

          resolve(jobs);
        } catch (error) {
          reject(new Error("Failed to parse CSV file"));
        }
      };

      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsText(file);
    });
  }

  private static parseCSVLine(line: string): string[] {
    const result = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"' && (i === 0 || line[i - 1] === ",")) {
        inQuotes = true;
      } else if (
        char === '"' &&
        inQuotes &&
        (i === line.length - 1 || line[i + 1] === ",")
      ) {
        inQuotes = false;
      } else if (char === "," && !inQuotes) {
        result.push(current);
        current = "";
      } else {
        current += char;
      }
    }

    result.push(current);
    return result.map((val) => val.replace(/^"|"$/g, ""));
  }
}
