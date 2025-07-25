"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { JobApplication } from "@/types/job";
import { Contact, Document } from "@/types/job";
import {
  jobApplicationSchema,
  type JobApplicationFormData,
} from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { TemplateManager } from "@/components/TemplateManager";
import { ContactManager } from "@/components/ContactManager";
import { notificationService } from "@/lib/notificationService";
import { accessibilityService } from "@/lib/accessibilityService";
import { documentService } from "@/lib/documentService";
import {
  FileText,
  Users,
  Upload,
  Loader2,
  Paperclip,
  Sparkles,
  Link as LinkIcon,
  Trash2,
} from "lucide-react";

interface AddJobDialogProps {
  onAddJob: (job: Omit<JobApplication, "id">) => JobApplication;
  children: React.ReactNode;
}

export function AddJobDialog({ onAddJob, children }: AddJobDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [linkedDocuments, setLinkedDocuments] = useState<Document[]>([]);

  const form = useForm<JobApplicationFormData>({
    resolver: zodResolver(jobApplicationSchema),
    defaultValues: {
      company: "",
      role: "",
      workLocation: "",
      salaryRange: {
        min: "",
        max: "",
        currency: "USD",
      },
      jobType: "full-time",
      workMode: "on-site",
      status: "applied",
      experienceLevel: "mid",
      category: "",
      priority: "medium",
      interviewDate: "",
      followUpDate: "",
      jobPostingUrl: "",
      interviewLink: "",
      notes: "",
    },
  });

  const onSubmit = async (data: JobApplicationFormData) => {
    setIsSubmitting(true);

    try {
      // First create the job without linked documents
      const newJob = {
        ...data,
        appliedDate: new Date().toISOString().split("T")[0],
        priority: data.priority || "medium",
        interviewDate: data.interviewDate || undefined,
        followUpDate: data.followUpDate || undefined,
        interviewLink: data.interviewLink || undefined,
        notes: data.notes || undefined,
        category: data.category || undefined,
        jobPostingUrl: data.jobPostingUrl || undefined,
        contacts: [],
        documents: [],
        statusHistory: [
          {
            id: `status-${Date.now()}`,
            status: data.status,
            date: new Date().toISOString(),
            notes: "Application created",
          },
        ],
      };

      // Call onAddJob which will return the job with the generated ID
      const createdJob = onAddJob(newJob);

      console.log("Job created successfully:", createdJob);

      // If there are linked documents, attach them to the job after it's created
      if (linkedDocuments.length > 0) {
        console.log(
          "Attaching documents to job:",
          linkedDocuments.length,
          "documents"
        );
        try {
          // Update each linked document with the new job ID
          linkedDocuments.forEach((doc) => {
            const success = documentService.attachDocumentToJob(
              doc.id,
              createdJob.id
            );
            console.log(`Document ${doc.id} attachment result:`, success);
          });
          console.log("Document attachment completed successfully");
        } catch (error) {
          console.error("Error during document attachment:", error);
          // Don't let document attachment errors prevent job creation
        }
      }

      // Schedule notifications
      const jobForNotifications = createdJob;
      notificationService.scheduleFollowUpReminder(jobForNotifications);
      if (newJob.interviewDate) {
        notificationService.scheduleInterviewReminder(jobForNotifications);
      }
      if (newJob.followUpDate) {
        notificationService.scheduleDeadlineReminder(jobForNotifications);
      }

      // Announce to screen readers
      accessibilityService.announce(
        `Added new application for ${data.role} at ${data.company}`
      );

      form.reset();
      setLinkedDocuments([]);
      setOpen(false);
    } catch (error) {
      console.error("Error adding job:", error);
      accessibilityService.announce(
        "Error adding application. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApplyTemplate = (templateData: Partial<JobApplication>) => {
    // Apply template data to form
    Object.entries(templateData).forEach(([key, value]) => {
      if (
        key === "salaryRange" &&
        value &&
        typeof value === "object" &&
        "min" in value
      ) {
        const salaryRange = value as {
          min?: string;
          max?: string;
          currency?: string;
        };
        form.setValue("salaryRange.min", salaryRange.min || "");
        form.setValue("salaryRange.max", salaryRange.max || "");
        form.setValue("salaryRange.currency", salaryRange.currency || "USD");
      } else if (
        value !== undefined &&
        key !== "contacts" &&
        key !== "documents" &&
        key !== "statusHistory"
      ) {
        form.setValue(key as any, value);
      }
    });

    setTemplateDialogOpen(false);
    accessibilityService.announce("Template applied successfully");
  };

  const handleAddContact = (contact: Omit<Contact, "id">) => {
    const newContact: Contact = {
      ...contact,
      id: `contact-${Date.now()}`,
    };
    setContacts((prev) => [...prev, newContact]);
    accessibilityService.announce(`Contact ${contact.name} added`);
  };

  const handleUpdateContact = (id: string, contact: Partial<Contact>) => {
    setContacts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...contact } : c))
    );
    accessibilityService.announce(`Contact updated`);
  };

  const handleDeleteContact = (id: string) => {
    setContacts((prev) => prev.filter((c) => c.id !== id));
    accessibilityService.announce(`Contact deleted`);
  };

  const handleLinkDocument = (document: Document) => {
    if (!linkedDocuments.find((doc) => doc.id === document.id)) {
      setLinkedDocuments([...linkedDocuments, document]);
      accessibilityService.announce(`Document ${document.name} linked`);
    }
  };

  const handleUnlinkDocument = (documentId: string) => {
    const document = linkedDocuments.find((doc) => doc.id === documentId);
    setLinkedDocuments(linkedDocuments.filter((doc) => doc.id !== documentId));
    if (document) {
      accessibilityService.announce(`Document ${document.name} unlinked`);
    }
  };

  const getAvailableDocuments = () => {
    return documentService
      .getDocuments()
      .filter((doc) => !linkedDocuments.find((linked) => linked.id === doc.id));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] max-w-[95vw] w-full sm:mx-4">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">
            Add New Job Application
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[calc(90vh-120px)]">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4 sm:space-y-6 pr-2 sm:pr-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="company"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        Company *
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter company name"
                          className="h-11 text-base"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        Role *
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter job role"
                          className="h-11 text-base"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="workLocation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        Work Location *
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., New York, NY"
                          className="h-11 text-base"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        Category
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Software Engineering"
                          className="h-11 text-base"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="jobType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        Job Type
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full h-11">
                            <SelectValue placeholder="Select job type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="full-time">Full-time</SelectItem>
                          <SelectItem value="part-time">Part-time</SelectItem>
                          <SelectItem value="contract">Contract</SelectItem>
                          <SelectItem value="freelance">Freelance</SelectItem>
                          <SelectItem value="internship">Internship</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="workMode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        Work Mode
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full h-11">
                            <SelectValue placeholder="Select work mode" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="remote">Remote</SelectItem>
                          <SelectItem value="on-site">On-site</SelectItem>
                          <SelectItem value="hybrid">Hybrid</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="experienceLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        Experience Level
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full h-11">
                            <SelectValue placeholder="Select level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="entry">Entry</SelectItem>
                          <SelectItem value="mid">Mid</SelectItem>
                          <SelectItem value="senior">Senior</SelectItem>
                          <SelectItem value="lead">Lead</SelectItem>
                          <SelectItem value="executive">Executive</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-2">
                <FormLabel>Salary Range</FormLabel>
                <div className="grid grid-cols-3 gap-2">
                  <FormField
                    control={form.control}
                    name="salaryRange.min"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input placeholder="Min (e.g., 80000)" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="salaryRange.max"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input placeholder="Max (e.g., 120000)" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="salaryRange.currency"
                    render={({ field }) => (
                      <FormItem>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="USD">USD</SelectItem>
                            <SelectItem value="EUR">EUR</SelectItem>
                            <SelectItem value="GBP">GBP</SelectItem>
                            <SelectItem value="CAD">CAD</SelectItem>
                            <SelectItem value="AUD">AUD</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="applied">Applied</SelectItem>
                        <SelectItem value="shortlisted">Shortlisted</SelectItem>
                        <SelectItem value="interview">Interview</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                        <SelectItem value="offered">Offered</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="jobPostingUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Posting URL</FormLabel>
                    <FormControl>
                      <Input
                        type="url"
                        placeholder="https://company.com/jobs/123"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Link to the original job posting (optional)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="interviewLink"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Interview Link</FormLabel>
                    <FormControl>
                      <Input
                        type="url"
                        placeholder="https://meet.google.com/..."
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Video call link for interviews (optional)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add any additional notes..."
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Any additional information about this application
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* New Fields: Priority, Interview Date, Follow-up Date */}
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="interviewDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Interview Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="followUpDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Follow-up Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              {/* Document Linking Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">Linked Documents</h4>
                  <span className="text-xs text-muted-foreground">
                    {linkedDocuments.length} linked
                  </span>
                </div>

                {linkedDocuments.length > 0 && (
                  <div className="space-y-2">
                    {linkedDocuments.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between bg-muted p-2 rounded-md min-w-0"
                      >
                        <div className="flex items-center space-x-2 min-w-0 flex-1">
                          <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <span
                              className="text-sm block truncate"
                              title={doc.name}
                            >
                              {doc.name}
                            </span>
                          </div>
                          <Badge
                            variant="outline"
                            className="text-xs flex-shrink-0"
                          >
                            {doc.type}
                          </Badge>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUnlinkDocument(doc.id)}
                          className="h-8 w-8 p-0 flex-shrink-0 ml-2"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-2">
                  <Select
                    onValueChange={(documentId) => {
                      const document = getAvailableDocuments().find(
                        (doc) => doc.id === documentId
                      );
                      if (document) {
                        handleLinkDocument(document);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Link an existing document" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableDocuments().map((doc) => (
                        <SelectItem key={doc.id} value={doc.id}>
                          <div className="flex items-center space-x-2 min-w-0 max-w-full">
                            <FileText className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate" title={doc.name}>
                              {doc.name}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                      {getAvailableDocuments().length === 0 && (
                        <SelectItem value="none" disabled>
                          No documents available to link
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setTemplateDialogOpen(true)}
                  className="flex-1 h-11"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Templates
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setContactDialogOpen(true)}
                  className="flex-1 h-11"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Contacts
                </Button>
              </div>

              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  className="w-full sm:w-auto h-11"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto h-11"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    "Add Application"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>

      {/* Template Manager Dialog */}
      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Application Templates</DialogTitle>
            <DialogDescription>
              Select or create templates to quickly fill out job applications.
            </DialogDescription>
          </DialogHeader>
          <TemplateManager
            onApplyTemplate={handleApplyTemplate}
            isOpen={templateDialogOpen}
            onOpenChange={setTemplateDialogOpen}
          />
        </DialogContent>
      </Dialog>

      {/* Contact Manager Dialog */}
      <Dialog open={contactDialogOpen} onOpenChange={setContactDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Contact Management</DialogTitle>
            <DialogDescription>
              Manage your professional contacts and networking connections.
            </DialogDescription>
          </DialogHeader>
          <ContactManager
            contacts={contacts}
            onAddContact={handleAddContact}
            onUpdateContact={handleUpdateContact}
            onDeleteContact={handleDeleteContact}
          />
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
