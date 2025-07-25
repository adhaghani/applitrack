"use client";

import { useState, useEffect, useMemo } from "react";
import { JobApplication, FilterOptions, SortOptions } from "@/types/job";
import { jobStorage } from "@/lib/jobStorage";
import { DataExportService } from "@/lib/dataExportService";
import { notificationService } from "@/lib/notificationService";
import { statusAutomationService } from "@/lib/statusAutomationService";
import { performanceService } from "@/lib/performanceService";
import { accessibilityService } from "@/lib/accessibilityService";
import { useKeyboardShortcut, keyboardService } from "@/lib/keyboardService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AddJobDialog } from "@/components/AddJobDialog";
import { DocumentManagerDialog } from "@/components/DocumentManagerDialog";
import { EditJobDialog } from "@/components/EditJobDialog";
import { JobCard } from "@/components/JobCard";
import { EnhancedFilters } from "@/components/EnhancedFilters";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { NotificationPanel } from "@/components/NotificationPanel";
import { KeyboardShortcutsHelp } from "@/components/KeyboardShortcutsHelp";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ScrollArea } from "@/components/ui/scroll-area";
import { searchJobs, filterJobs } from "@/lib/searchUtils";
import {
  FadeIn,
  LoadingSpinner,
  AnimatedCounter,
} from "@/components/ui/animations";
import {
  Plus,
  Search,
  Briefcase,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Download,
  Upload,
  Archive,
  Bell,
  Keyboard,
  Lightbulb,
} from "lucide-react";

export default function JobTracker() {
  const [jobs, setJobs] = useState<JobApplication[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingJob, setEditingJob] = useState<JobApplication | null>(null);
  const [filters, setFilters] = useState<FilterOptions>({});
  const [sort, setSort] = useState<SortOptions>({
    field: "appliedDate",
    order: "desc",
  });
  const [loading, setLoading] = useState(true);
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);
  const [keyboardHelpOpen, setKeyboardHelpOpen] = useState(false);
  const [documentManagerOpen, setDocumentManagerOpen] = useState(false);
  const [selectedJobForDocuments, setSelectedJobForDocuments] = useState<
    string | undefined
  >(undefined);

  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<JobApplication | null>(null);

  // Initialize services and load data
  useEffect(() => {
    const initializeApp = async () => {
      setLoading(true);

      // Request notification permissions
      await notificationService.requestPermission();

      // Load jobs
      const loadedJobs = jobStorage.getAll();
      setJobs(loadedJobs);

      // Check for status automation suggestions
      const suggestions = statusAutomationService.analyzeJobs(loadedJobs);
      if (suggestions.length > 0) {
        console.log(`Found ${suggestions.length} status suggestions`);
      }

      setLoading(false);

      // Announce app ready to screen readers
      accessibilityService.announce(
        "Job tracker application loaded successfully"
      );
    };

    initializeApp();
  }, []);

  // Keyboard shortcuts
  useKeyboardShortcut(
    "n",
    () => {
      const addButton = document.querySelector(
        '[aria-label="Add new job application"]'
      ) as HTMLElement;
      addButton?.click();
    },
    { ctrlKey: true, description: "Add new job application" }
  );

  useKeyboardShortcut(
    "f",
    () => {
      const searchInput = document.querySelector(
        'input[placeholder*="Search"]'
      ) as HTMLElement;
      searchInput?.focus();
    },
    { ctrlKey: true, description: "Focus search" }
  );

  useKeyboardShortcut("?", () => setKeyboardHelpOpen(true), {
    description: "Show keyboard shortcuts",
  });

  useKeyboardShortcut("b", () => setNotificationPanelOpen((prev) => !prev), {
    ctrlKey: true,
    description: "Toggle notifications",
  });

  useKeyboardShortcut("d", () => setDocumentManagerOpen((prev) => !prev), {
    ctrlKey: true,
    description: "Open document manager",
  });

  const handleAddJob = (jobData: Omit<JobApplication, "id">) => {
    const newJob = jobStorage.add(jobData);
    setJobs((prev) => [...prev, newJob]);

    // Schedule notifications if enabled
    notificationService.scheduleFollowUpReminder(newJob);
    if (newJob.interviewDate) {
      notificationService.scheduleInterviewReminder(newJob);
    }

    // Announce to screen readers
    accessibilityService.announce(
      `Added new application for ${newJob.role} at ${newJob.company}`
    );
  };

  const handleUpdateJob = (id: string, updates: Partial<JobApplication>) => {
    jobStorage.update(id, updates);
    setJobs((prev) =>
      prev.map((job) => (job.id === id ? { ...job, ...updates } : job))
    );

    // Check for status automation suggestions when status changes
    if (updates.status) {
      const updatedJob = jobs.find((j) => j.id === id);
      if (updatedJob) {
        const suggestions = statusAutomationService.analyzeJobs([
          { ...updatedJob, ...updates },
        ]);
        if (suggestions.length > 0) {
          console.log("Status update suggestions:", suggestions);
        }
      }
    }

    // Announce update to screen readers
    if (updates.status) {
      accessibilityService.announce(`Updated status to ${updates.status}`);
    }
  };

  const handleDeleteJob = (id: string) => {
    const job = jobs.find((j) => j.id === id);
    if (job) {
      setJobToDelete(job);
      setDeleteDialogOpen(true);
    }
  };

  const confirmDeleteJob = () => {
    if (jobToDelete) {
      jobStorage.delete(jobToDelete.id);
      setJobs((prev) => prev.filter((job) => job.id !== jobToDelete.id));
      setJobToDelete(null);
    }
  };

  const handleManageDocuments = (jobId: string) => {
    setSelectedJobForDocuments(jobId);
    setDocumentManagerOpen(true);
  };

  const handleDocumentManagerClose = () => {
    setDocumentManagerOpen(false);
    setSelectedJobForDocuments(undefined);
  };

  const handleClearFilters = () => {
    setFilters({});
    setSearchTerm("");
  };

  const handleExportCSV = () => {
    DataExportService.exportJobs(jobs, { format: "csv" });
  };

  const handleExportJSON = () => {
    DataExportService.exportJobs(jobs, { format: "json" });
  };

  const handleImportData = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      let importedJobs: JobApplication[] = [];

      if (file.name.endsWith(".json")) {
        importedJobs = await DataExportService.importFromJSON(file);
      } else if (file.name.endsWith(".csv")) {
        importedJobs = await DataExportService.importFromCSV(file);
      } else {
        throw new Error("Unsupported file format");
      }

      if (importedJobs.length > 0) {
        // Add imported jobs using jobStorage.add to ensure proper ID generation
        importedJobs.forEach((job) => {
          const { id, ...jobWithoutId } = job;
          jobStorage.add(jobWithoutId);
        });

        // Refresh the jobs list
        setJobs(jobStorage.getAll());
      }
    } catch (error) {
      console.error("Import failed:", error);
      // You could add a toast notification here
    }

    // Reset the input
    event.target.value = "";
  };

  // Get unique categories for filter options
  const categories = useMemo(() => {
    const cats = jobs
      .map((job) => job.category)
      .filter((cat): cat is string => Boolean(cat))
      .filter((cat, index, arr) => arr.indexOf(cat) === index)
      .sort();
    return cats;
  }, [jobs]);

  // Filter and sort jobs using enhanced search utilities
  const filteredAndSortedJobs = useMemo(() => {
    // First apply search if there's a search term
    let filtered = searchTerm ? searchJobs(jobs, searchTerm) : jobs;

    // Then apply filters
    filtered = filterJobs(filtered, filters);

    // Finally sort the results
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sort.field) {
        case "appliedDate":
          comparison =
            new Date(a.appliedDate).getTime() -
            new Date(b.appliedDate).getTime();
          break;
        case "company":
          comparison = a.company.localeCompare(b.company);
          break;
        case "role":
          comparison = a.role.localeCompare(b.role);
          break;
        case "status":
          comparison = a.status.localeCompare(b.status);
          break;
        case "priority":
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          const aPriority = a.priority
            ? priorityOrder[a.priority as keyof typeof priorityOrder] || 0
            : 0;
          const bPriority = b.priority
            ? priorityOrder[b.priority as keyof typeof priorityOrder] || 0
            : 0;
          comparison = aPriority - bPriority;
          break;
        case "interviewDate":
          const aDate = a.interviewDate
            ? new Date(a.interviewDate).getTime()
            : 0;
          const bDate = b.interviewDate
            ? new Date(b.interviewDate).getTime()
            : 0;
          comparison = aDate - bDate;
          break;
      }

      return sort.order === "desc" ? -comparison : comparison;
    });

    return filtered;
  }, [jobs, searchTerm, filters, sort]);

  const getStats = () => {
    const total = jobs.length;
    const applied = jobs.filter((j) => j.status === "applied").length;
    const interviews = jobs.filter((j) => j.status === "interview").length;
    const offers = jobs.filter((j) => j.status === "offered").length;
    const rejected = jobs.filter((j) => j.status === "rejected").length;
    const upcomingInterviews = jobs.filter(
      (j) => j.interviewDate && new Date(j.interviewDate) > new Date()
    ).length;
    const highPriority = jobs.filter((j) => j.priority === "high").length;

    return {
      total,
      applied,
      interviews,
      offers,
      rejected,
      upcomingInterviews,
      highPriority,
    };
  };

  const stats = getStats();

  return (
    <ErrorBoundary>
      {loading ? (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <LoadingSpinner size="lg" className="mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Loading Job Tracker</h2>
            <p className="text-muted-foreground">
              Setting up your application dashboard...
            </p>
          </div>
        </div>
      ) : (
        <div className="min-h-screen bg-background">
          <div className="container mx-auto py-4 sm:py-8 px-4">
            <div className="mb-6 sm:mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
                    Job Application Tracker
                  </h1>
                  <p className="text-muted-foreground text-sm sm:text-base">
                    Track and manage your job applications in one place
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setNotificationPanelOpen(true)}
                    className="hidden sm:flex"
                  >
                    <Bell className="w-4 h-4 mr-2" />
                    Notifications
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setKeyboardHelpOpen(true)}
                    className="hidden sm:flex"
                  >
                    <Keyboard className="w-4 h-4 mr-2" />
                    Shortcuts
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDocumentManagerOpen(true)}
                    className="hidden sm:flex"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Documents
                  </Button>
                </div>
              </div>

              {/* Enhanced Statistics Dashboard */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4 mb-6">
                <FadeIn delay={0}>
                  <div className="bg-card rounded-lg p-3 sm:p-4 border shadow-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <Briefcase className="w-4 h-4 text-primary" />
                      <span className="text-xs sm:text-sm font-medium text-muted-foreground">
                        Total
                      </span>
                    </div>
                    <AnimatedCounter
                      value={stats.total}
                      className="text-xl sm:text-2xl font-bold"
                    />
                  </div>
                </FadeIn>

                <FadeIn delay={100}>
                  <div className="bg-card rounded-lg p-3 sm:p-4 border shadow-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-4 h-4 text-blue-500" />
                      <span className="text-xs sm:text-sm font-medium text-muted-foreground">
                        Applied
                      </span>
                    </div>
                    <AnimatedCounter
                      value={stats.applied}
                      className="text-xl sm:text-2xl font-bold text-blue-600"
                    />
                  </div>
                </FadeIn>

                <FadeIn delay={200}>
                  <div className="bg-card rounded-lg p-3 sm:p-4 border shadow-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="w-4 h-4 text-yellow-500" />
                      <span className="text-xs sm:text-sm font-medium text-muted-foreground">
                        Interviews
                      </span>
                    </div>
                    <AnimatedCounter
                      value={stats.interviews}
                      className="text-xl sm:text-2xl font-bold text-yellow-600"
                    />
                  </div>
                </FadeIn>

                <FadeIn delay={300}>
                  <div className="bg-card rounded-lg p-3 sm:p-4 border shadow-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-xs sm:text-sm font-medium text-muted-foreground">
                        Offers
                      </span>
                    </div>
                    <AnimatedCounter
                      value={stats.offers}
                      className="text-xl sm:text-2xl font-bold text-green-600"
                    />
                  </div>
                </FadeIn>

                <FadeIn delay={400}>
                  <div className="bg-card rounded-lg p-3 sm:p-4 border shadow-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <XCircle className="w-4 h-4 text-red-500" />
                      <span className="text-xs sm:text-sm font-medium text-muted-foreground">
                        Rejected
                      </span>
                    </div>
                    <AnimatedCounter
                      value={stats.rejected}
                      className="text-xl sm:text-2xl font-bold text-red-600"
                    />
                  </div>
                </FadeIn>

                <FadeIn delay={500}>
                  <div className="bg-card rounded-lg p-3 sm:p-4 border shadow-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-4 h-4 text-purple-500" />
                      <span className="text-xs sm:text-sm font-medium text-muted-foreground">
                        Upcoming
                      </span>
                    </div>
                    <AnimatedCounter
                      value={stats.upcomingInterviews}
                      className="text-xl sm:text-2xl font-bold text-purple-600"
                    />
                  </div>
                </FadeIn>

                <FadeIn delay={600}>
                  <div className="bg-card rounded-lg p-3 sm:p-4 border shadow-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <Lightbulb className="w-4 h-4 text-orange-500" />
                      <span className="text-xs sm:text-sm font-medium text-muted-foreground">
                        Priority
                      </span>
                    </div>
                    <AnimatedCounter
                      value={stats.highPriority}
                      className="text-xl sm:text-2xl font-bold text-orange-600"
                    />
                  </div>
                </FadeIn>
              </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col gap-4 mb-6">
              {/* Search and Filters Row */}
              <div className="flex flex-col sm:flex-row gap-4">
                <EnhancedFilters
                  filters={filters}
                  sort={sort}
                  searchTerm={searchTerm}
                  onFiltersChange={setFilters}
                  onSortChange={setSort}
                  onSearchChange={setSearchTerm}
                  onClearFilters={handleClearFilters}
                  categories={categories}
                />
              </div>

              {/* Action Buttons Row */}
              <div className="flex flex-wrap gap-2 justify-between items-center">
                {/* Export/Import buttons */}
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={handleExportCSV}>
                    <Download className="h-4 w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Export </span>CSV
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportJSON}
                  >
                    <Download className="h-4 w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Export </span>JSON
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <label htmlFor="import-file" className="cursor-pointer">
                      <Upload className="h-4 w-4 mr-1 sm:mr-2" />
                      Import
                    </label>
                  </Button>
                  <input
                    id="import-file"
                    type="file"
                    accept=".json,.csv"
                    onChange={handleImportData}
                    className="hidden"
                  />
                </div>

                {/* Add Job Button */}
                <AddJobDialog onAddJob={handleAddJob}>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Job
                  </Button>
                </AddJobDialog>
              </div>
            </div>

            {/* Results info */}
            {(searchTerm ||
              Object.keys(filters).some(
                (key) => filters[key as keyof FilterOptions]
              )) && (
              <div className="mb-4 text-sm text-muted-foreground">
                Showing {filteredAndSortedJobs.length} of {jobs.length}{" "}
                applications
                {searchTerm && ` for "${searchTerm}"`}
                {Object.keys(filters).some(
                  (key) => filters[key as keyof FilterOptions]
                ) && (
                  <Button
                    variant="link"
                    size="sm"
                    onClick={handleClearFilters}
                    className="p-0 ml-2 h-auto text-sm"
                  >
                    Clear filters
                  </Button>
                )}
              </div>
            )}

            {/* Job Cards */}
            {filteredAndSortedJobs.length === 0 ? (
              <div className="text-center py-12">
                <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {jobs.length === 0
                    ? "No job applications yet"
                    : "No jobs match your criteria"}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {jobs.length === 0
                    ? "Start tracking your job applications by adding your first one!"
                    : "Try adjusting your search or filter criteria."}
                </p>
                {jobs.length === 0 && (
                  <AddJobDialog onAddJob={handleAddJob}>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Job
                    </Button>
                  </AddJobDialog>
                )}
              </div>
            ) : (
              <ScrollArea className="h-[calc(100vh-350px)] sm:h-[calc(100vh-400px)]">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 pr-2 sm:pr-4">
                  {filteredAndSortedJobs.map((job) => (
                    <JobCard
                      key={job.id}
                      job={job}
                      onEdit={setEditingJob}
                      onDelete={handleDeleteJob}
                      onStatusChange={handleUpdateJob}
                      onManageDocuments={handleManageDocuments}
                    />
                  ))}
                </div>
              </ScrollArea>
            )}

            {/* Edit Dialog */}
            {editingJob && (
              <EditJobDialog
                job={editingJob}
                open={!!editingJob}
                onOpenChange={(open) => !open && setEditingJob(null)}
                onUpdateJob={handleUpdateJob}
              />
            )}

            {/* Delete Confirmation Dialog */}
            <DeleteConfirmDialog
              open={deleteDialogOpen}
              onOpenChange={setDeleteDialogOpen}
              onConfirm={confirmDeleteJob}
              jobTitle={jobToDelete?.role}
              companyName={jobToDelete?.company}
            />

            {/* Notification Panel */}
            <NotificationPanel
              jobs={jobs}
              open={notificationPanelOpen}
              onOpenChange={setNotificationPanelOpen}
            />

            {/* Keyboard Shortcuts Help */}
            <KeyboardShortcutsHelp
              shortcuts={[
                {
                  name: "Application Management",
                  shortcuts: keyboardService.getAllShortcuts(),
                },
              ]}
              open={keyboardHelpOpen}
              onOpenChange={setKeyboardHelpOpen}
            />

            {/* Document Manager Dialog */}
            <DocumentManagerDialog
              jobId={selectedJobForDocuments}
              open={documentManagerOpen}
              onOpenChange={handleDocumentManagerClose}
            />
          </div>
        </div>
      )}
    </ErrorBoundary>
  );
}
