import { JobApplication } from "@/types/job";

export function searchJobs(
  jobs: JobApplication[],
  searchTerm: string
): JobApplication[] {
  if (!searchTerm.trim()) return jobs;

  const terms = searchTerm
    .toLowerCase()
    .split(" ")
    .filter((term) => term.length > 0);

  return jobs.filter((job) => {
    const searchableText = [
      job.company,
      job.role,
      job.workLocation,
      job.category,
      job.notes,
      job.status,
      job.jobType,
      job.workMode,
      job.experienceLevel,
      job.salaryRange?.currency,
      // Search in contacts if they exist
      ...(
        job.contacts?.map((contact) =>
          [contact.name, contact.title, contact.email].filter(Boolean)
        ) || []
      ).flat(),
      // Search in documents if they exist
      ...(job.documents?.map((doc) => doc.name) || []),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return terms.every((term) => searchableText.includes(term));
  });
}

export function filterJobs(
  jobs: JobApplication[],
  filters: any
): JobApplication[] {
  return jobs.filter((job) => {
    // Status filter
    if (
      filters.status &&
      filters.status !== "all" &&
      job.status !== filters.status
    ) {
      return false;
    }

    // Job type filter
    if (
      filters.jobType &&
      filters.jobType !== "all" &&
      job.jobType !== filters.jobType
    ) {
      return false;
    }

    // Work mode filter
    if (
      filters.workMode &&
      filters.workMode !== "all" &&
      job.workMode !== filters.workMode
    ) {
      return false;
    }

    // Experience level filter
    if (
      filters.experienceLevel &&
      filters.experienceLevel !== "all" &&
      job.experienceLevel !== filters.experienceLevel
    ) {
      return false;
    }

    // Priority filter
    if (
      filters.priority &&
      filters.priority !== "all" &&
      job.priority !== filters.priority
    ) {
      return false;
    }

    // Category filter
    if (
      filters.category &&
      filters.category !== "all" &&
      job.category !== filters.category
    ) {
      return false;
    }

    // Location filter
    if (
      filters.location &&
      !job.workLocation.toLowerCase().includes(filters.location.toLowerCase())
    ) {
      return false;
    }

    // Salary range filter
    if (filters.salaryRange) {
      const jobMinSalary = job.salaryRange?.min
        ? parseInt(job.salaryRange.min)
        : 0;
      const jobMaxSalary = job.salaryRange?.max
        ? parseInt(job.salaryRange.max)
        : 999999;

      if (
        jobMaxSalary < filters.salaryRange.min ||
        jobMinSalary > filters.salaryRange.max
      ) {
        return false;
      }
    }

    // Date range filter
    if (filters.dateRange) {
      const jobDate = new Date(job.appliedDate);
      const startDate = new Date(filters.dateRange.start);
      const endDate = new Date(filters.dateRange.end);

      if (jobDate < startDate || jobDate > endDate) {
        return false;
      }
    }

    // Has interview filter
    if (filters.hasInterview !== undefined) {
      const hasInterview =
        job.status === "interview" ||
        !!job.interviewDate ||
        !!job.interviewLink;
      if (filters.hasInterview !== hasInterview) {
        return false;
      }
    }

    // Archived filter
    if (filters.archived !== undefined && job.archived !== filters.archived) {
      return false;
    }

    return true;
  });
}
