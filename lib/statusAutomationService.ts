import { JobApplication } from "@/types/job";

export interface StatusRule {
  id: string;
  name: string;
  description: string;
  fromStatus: JobApplication["status"];
  toStatus: JobApplication["status"];
  condition: "time_elapsed" | "interview_date_passed" | "manual_trigger";
  timeDelay?: number; // in days
  isActive: boolean;
  createdAt: string;
}

export interface StatusSuggestion {
  jobId: string;
  currentStatus: JobApplication["status"];
  suggestedStatus: JobApplication["status"];
  reason: string;
  confidence: number; // 0-1
  autoApply: boolean;
}

class StatusAutomationService {
  private readonly STORAGE_KEY = "applitrack-status-rules";
  private rules: StatusRule[] = [];

  constructor() {
    this.rules = this.loadRules();
    this.initializeDefaultRules();
  }

  private loadRules(): StatusRule[] {
    if (typeof window === "undefined") return [];

    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }

  private saveRules(): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.rules));
  }

  private initializeDefaultRules(): void {
    if (this.rules.length === 0) {
      const defaultRules: StatusRule[] = [
        {
          id: "applied-to-followup",
          name: "Applied → Follow-up Needed",
          description: "Suggest follow-up after 7 days of applying",
          fromStatus: "applied",
          toStatus: "applied", // Status stays same, but suggests action
          condition: "time_elapsed",
          timeDelay: 7,
          isActive: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: "interview-to-followup",
          name: "Interview → Follow-up",
          description: "Suggest follow-up 3 days after interview date",
          fromStatus: "interview",
          toStatus: "interview",
          condition: "interview_date_passed",
          timeDelay: 3,
          isActive: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: "shortlisted-stale",
          name: "Shortlisted → Follow-up",
          description: "Follow up on shortlisted applications after 10 days",
          fromStatus: "shortlisted",
          toStatus: "shortlisted",
          condition: "time_elapsed",
          timeDelay: 10,
          isActive: true,
          createdAt: new Date().toISOString(),
        },
      ];

      this.rules = defaultRules;
      this.saveRules();
    }
  }

  generateId(): string {
    return `rule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  createRule(ruleData: Omit<StatusRule, "id" | "createdAt">): StatusRule {
    const newRule: StatusRule = {
      ...ruleData,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
    };

    this.rules.push(newRule);
    this.saveRules();
    return newRule;
  }

  updateRule(id: string, updates: Partial<StatusRule>): StatusRule | null {
    const index = this.rules.findIndex((r) => r.id === id);
    if (index === -1) return null;

    this.rules[index] = { ...this.rules[index], ...updates };
    this.saveRules();
    return this.rules[index];
  }

  deleteRule(id: string): boolean {
    const index = this.rules.findIndex((r) => r.id === id);
    if (index === -1) return false;

    this.rules.splice(index, 1);
    this.saveRules();
    return true;
  }

  getRules(): StatusRule[] {
    return [...this.rules];
  }

  getActiveRules(): StatusRule[] {
    return this.rules.filter((r) => r.isActive);
  }

  // Analyze jobs and provide status suggestions
  analyzeJobs(jobs: JobApplication[]): StatusSuggestion[] {
    const suggestions: StatusSuggestion[] = [];
    const now = new Date();
    const activeRules = this.getActiveRules();

    jobs.forEach((job) => {
      activeRules.forEach((rule) => {
        if (job.status !== rule.fromStatus) return;

        let shouldSuggest = false;
        let reason = "";
        let confidence = 0.7;

        switch (rule.condition) {
          case "time_elapsed":
            if (rule.timeDelay) {
              const appliedDate = new Date(job.appliedDate);
              const daysSinceApplied = Math.floor(
                (now.getTime() - appliedDate.getTime()) / (1000 * 60 * 60 * 24)
              );

              if (daysSinceApplied >= rule.timeDelay) {
                shouldSuggest = true;
                reason = `${daysSinceApplied} days since application`;
                confidence = Math.min(
                  0.9,
                  0.5 + (daysSinceApplied / rule.timeDelay) * 0.4
                );
              }
            }
            break;

          case "interview_date_passed":
            if (job.interviewDate && rule.timeDelay) {
              const interviewDate = new Date(job.interviewDate);
              const daysSinceInterview = Math.floor(
                (now.getTime() - interviewDate.getTime()) /
                  (1000 * 60 * 60 * 24)
              );

              if (daysSinceInterview >= rule.timeDelay) {
                shouldSuggest = true;
                reason = `${daysSinceInterview} days since interview`;
                confidence = Math.min(
                  0.95,
                  0.6 + (daysSinceInterview / rule.timeDelay) * 0.35
                );
              }
            }
            break;
        }

        if (shouldSuggest) {
          suggestions.push({
            jobId: job.id,
            currentStatus: job.status,
            suggestedStatus: rule.toStatus,
            reason: `${rule.name}: ${reason}`,
            confidence,
            autoApply: false, // Always require manual approval for now
          });
        }
      });
    });

    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }

  // Smart status progression suggestions based on patterns
  getSmartStatusSuggestions(jobs: JobApplication[]): Array<{
    jobId: string;
    suggestion: string;
    action: string;
    priority: "low" | "medium" | "high";
  }> {
    const suggestions: Array<{
      jobId: string;
      suggestion: string;
      action: string;
      priority: "low" | "medium" | "high";
    }> = [];
    const now = new Date();

    jobs.forEach((job) => {
      // Check for upcoming interviews
      if (job.interviewDate) {
        const interviewDate = new Date(job.interviewDate);
        const daysUntilInterview = Math.floor(
          (interviewDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysUntilInterview === 1) {
          suggestions.push({
            jobId: job.id,
            suggestion: "Interview tomorrow - prepare and confirm details",
            action: "prepare-interview",
            priority: "high" as const,
          });
        } else if (daysUntilInterview <= 3 && daysUntilInterview > 0) {
          suggestions.push({
            jobId: job.id,
            suggestion: `Interview in ${daysUntilInterview} days - start preparing`,
            action: "prepare-interview",
            priority: "medium" as const,
          });
        }
      }

      // Check for follow-up opportunities
      if (job.followUpDate) {
        const followUpDate = new Date(job.followUpDate);
        const daysUntilFollowUp = Math.floor(
          (followUpDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysUntilFollowUp <= 0) {
          suggestions.push({
            jobId: job.id,
            suggestion: "Follow-up date reached - send follow-up message",
            action: "send-followup",
            priority: "high" as const,
          });
        } else if (daysUntilFollowUp <= 2) {
          suggestions.push({
            jobId: job.id,
            suggestion: `Follow-up due in ${daysUntilFollowUp} days`,
            action: "prepare-followup",
            priority: "medium" as const,
          });
        }
      }

      // Check for stale applications
      const appliedDate = new Date(job.appliedDate);
      const daysSinceApplied = Math.floor(
        (now.getTime() - appliedDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (
        job.status === "applied" &&
        daysSinceApplied >= 14 &&
        !job.followUpDate
      ) {
        suggestions.push({
          jobId: job.id,
          suggestion: `No response for ${daysSinceApplied} days - consider following up`,
          action: "schedule-followup",
          priority: "low" as const,
        });
      }

      // Check for interview follow-ups
      if (job.status === "interview" && job.interviewDate) {
        const interviewDate = new Date(job.interviewDate);
        const daysSinceInterview = Math.floor(
          (now.getTime() - interviewDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysSinceInterview >= 5 && daysSinceInterview <= 10) {
          suggestions.push({
            jobId: job.id,
            suggestion: `${daysSinceInterview} days since interview - consider following up`,
            action: "interview-followup",
            priority: "medium" as const,
          });
        }
      }
    });

    return suggestions.sort((a, b) => {
      const priorityOrder: Record<"high" | "medium" | "low", number> = {
        high: 3,
        medium: 2,
        low: 1,
      };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  // Auto-progress status based on rules (for future implementation)
  autoProgressStatus(
    job: JobApplication,
    suggestions: StatusSuggestion[]
  ): JobApplication | null {
    const applicableSuggestion = suggestions.find(
      (s) => s.jobId === job.id && s.autoApply && s.confidence > 0.8
    );

    if (applicableSuggestion) {
      return {
        ...job,
        status: applicableSuggestion.suggestedStatus,
        statusHistory: [
          ...(job.statusHistory || []),
          {
            id: `status-${Date.now()}`,
            status: applicableSuggestion.suggestedStatus,
            date: new Date().toISOString(),
            notes: `Auto-updated: ${applicableSuggestion.reason}`,
          },
        ],
      };
    }

    return null;
  }

  // Batch analyze and get summary
  getBatchAnalysisSummary(jobs: JobApplication[]): {
    totalJobs: number;
    statusSuggestions: number;
    smartSuggestions: number;
    urgentActions: number;
    summary: string;
  } {
    const statusSuggestions = this.analyzeJobs(jobs);
    const smartSuggestions = this.getSmartStatusSuggestions(jobs);
    const urgentActions = smartSuggestions.filter(
      (s) => s.priority === "high"
    ).length;

    let summary = "";
    if (urgentActions > 0) {
      summary = `${urgentActions} urgent action${
        urgentActions > 1 ? "s" : ""
      } needed`;
    } else if (statusSuggestions.length > 0) {
      summary = `${statusSuggestions.length} status update${
        statusSuggestions.length > 1 ? "s" : ""
      } suggested`;
    } else if (smartSuggestions.length > 0) {
      summary = `${smartSuggestions.length} recommendation${
        smartSuggestions.length > 1 ? "s" : ""
      } available`;
    } else {
      summary = "All applications are up to date";
    }

    return {
      totalJobs: jobs.length,
      statusSuggestions: statusSuggestions.length,
      smartSuggestions: smartSuggestions.length,
      urgentActions,
      summary,
    };
  }
}

export const statusAutomationService = new StatusAutomationService();
