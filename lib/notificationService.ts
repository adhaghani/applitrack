import { JobApplication } from "@/types/job";

export interface NotificationSettings {
  enabled: boolean;
  followUpReminders: boolean;
  interviewReminders: boolean;
  applicationDeadlines: boolean;
  statusUpdates: boolean;
  reminderDays: number;
  interviewReminderHours: number;
}

export interface SmartNotification {
  id: string;
  type: "follow-up" | "interview" | "deadline" | "status-update";
  title: string;
  message: string;
  jobId: string;
  scheduledFor: Date;
  isRead: boolean;
  isSent: boolean;
  createdAt: Date;
}

class NotificationService {
  private readonly STORAGE_KEY = "applitrack-notifications";
  private readonly SETTINGS_KEY = "applitrack-notification-settings";
  private notifications: SmartNotification[] = [];
  private settings: NotificationSettings;

  constructor() {
    this.settings = this.loadSettings();
    this.notifications = this.loadNotifications();
    this.setupPeriodicCheck();
  }

  private loadSettings(): NotificationSettings {
    if (typeof window === "undefined") return this.getDefaultSettings();

    try {
      const saved = localStorage.getItem(this.SETTINGS_KEY);
      return saved
        ? { ...this.getDefaultSettings(), ...JSON.parse(saved) }
        : this.getDefaultSettings();
    } catch {
      return this.getDefaultSettings();
    }
  }

  private getDefaultSettings(): NotificationSettings {
    return {
      enabled: true,
      followUpReminders: true,
      interviewReminders: true,
      applicationDeadlines: true,
      statusUpdates: true,
      reminderDays: 7,
      interviewReminderHours: 24,
    };
  }

  private loadNotifications(): SmartNotification[] {
    if (typeof window === "undefined") return [];

    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (!saved) return [];

      return JSON.parse(saved).map((n: any) => ({
        ...n,
        scheduledFor: new Date(n.scheduledFor),
        createdAt: new Date(n.createdAt),
      }));
    } catch {
      return [];
    }
  }

  private saveNotifications(): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.notifications));
  }

  private saveSettings(): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(this.settings));
  }

  updateSettings(newSettings: Partial<NotificationSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    this.saveSettings();
  }

  getSettings(): NotificationSettings {
    return { ...this.settings };
  }

  async requestPermission(): Promise<boolean> {
    if (!("Notification" in window)) return false;

    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  private generateId(): string {
    return `notification-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;
  }

  private createNotification(
    type: SmartNotification["type"],
    title: string,
    message: string,
    jobId: string,
    scheduledFor: Date
  ): SmartNotification {
    return {
      id: this.generateId(),
      type,
      title,
      message,
      jobId,
      scheduledFor,
      isRead: false,
      isSent: false,
      createdAt: new Date(),
    };
  }

  scheduleFollowUpReminder(job: JobApplication): void {
    if (!this.settings.enabled || !this.settings.followUpReminders) return;

    const followUpDate = new Date();
    followUpDate.setDate(followUpDate.getDate() + this.settings.reminderDays);

    const notification = this.createNotification(
      "follow-up",
      "Follow-up Reminder",
      `Time to follow up on your application to ${job.company} for ${job.role}`,
      job.id,
      followUpDate
    );

    this.notifications.push(notification);
    this.saveNotifications();
  }

  scheduleInterviewReminder(job: JobApplication): void {
    if (
      !this.settings.enabled ||
      !this.settings.interviewReminders ||
      !job.interviewDate
    )
      return;

    const reminderDate = new Date(job.interviewDate);
    reminderDate.setHours(
      reminderDate.getHours() - this.settings.interviewReminderHours
    );

    const notification = this.createNotification(
      "interview",
      "Interview Reminder",
      `Interview tomorrow at ${new Date(
        job.interviewDate
      ).toLocaleTimeString()} with ${job.company}`,
      job.id,
      reminderDate
    );

    this.notifications.push(notification);
    this.saveNotifications();
  }

  scheduleDeadlineReminder(job: JobApplication): void {
    if (
      !this.settings.enabled ||
      !this.settings.applicationDeadlines ||
      !job.followUpDate
    )
      return;

    const reminderDate = new Date(job.followUpDate);
    reminderDate.setDate(reminderDate.getDate() - 2); // 2 days before follow-up date

    const notification = this.createNotification(
      "deadline",
      "Follow-up Date Reminder",
      `Follow-up date for ${job.role} at ${job.company} is in 2 days`,
      job.id,
      reminderDate
    );

    this.notifications.push(notification);
    this.saveNotifications();
  }

  notifyStatusUpdate(
    job: JobApplication,
    oldStatus: string,
    newStatus: string
  ): void {
    if (!this.settings.enabled || !this.settings.statusUpdates) return;

    const notification = this.createNotification(
      "status-update",
      "Application Status Updated",
      `${job.company} - ${job.role}: Status changed from ${oldStatus} to ${newStatus}`,
      job.id,
      new Date()
    );

    this.notifications.push(notification);
    this.saveNotifications();
    this.sendBrowserNotification(notification);
  }

  private async sendBrowserNotification(
    notification: SmartNotification
  ): Promise<void> {
    if (!("Notification" in window) || Notification.permission !== "granted")
      return;

    try {
      const browserNotification = new Notification(notification.title, {
        body: notification.message,
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        requireInteraction: true,
      });

      browserNotification.onclick = () => {
        window.focus();
        this.markAsRead(notification.id);
        browserNotification.close();
      };

      // Mark as sent
      const index = this.notifications.findIndex(
        (n) => n.id === notification.id
      );
      if (index !== -1) {
        this.notifications[index].isSent = true;
        this.saveNotifications();
      }
    } catch (error) {
      console.error("Failed to send browser notification:", error);
    }
  }

  private setupPeriodicCheck(): void {
    if (typeof window === "undefined") return;

    // Check for pending notifications every minute
    setInterval(() => {
      this.checkPendingNotifications();
    }, 60000);

    // Initial check
    setTimeout(() => this.checkPendingNotifications(), 1000);
  }

  private checkPendingNotifications(): void {
    const now = new Date();
    const pendingNotifications = this.notifications.filter(
      (n) => !n.isSent && n.scheduledFor <= now
    );

    pendingNotifications.forEach((notification) => {
      this.sendBrowserNotification(notification);
    });
  }

  getNotifications(): SmartNotification[] {
    return [...this.notifications].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  getUnreadCount(): number {
    return this.notifications.filter((n) => !n.isRead).length;
  }

  markAsRead(id: string): void {
    const index = this.notifications.findIndex((n) => n.id === id);
    if (index !== -1) {
      this.notifications[index].isRead = true;
      this.saveNotifications();
    }
  }

  markAllAsRead(): void {
    this.notifications.forEach((n) => (n.isRead = true));
    this.saveNotifications();
  }

  deleteNotification(id: string): void {
    this.notifications = this.notifications.filter((n) => n.id !== id);
    this.saveNotifications();
  }

  clearAllNotifications(): void {
    this.notifications = [];
    this.saveNotifications();
  }

  // Smart suggestions based on application patterns
  getSuggestedActions(jobs: JobApplication[]): Array<{
    type: string;
    message: string;
    jobId?: string;
    action: string;
  }> {
    const suggestions: Array<{
      type: string;
      message: string;
      jobId?: string;
      action: string;
    }> = [];
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Find applications needing follow-up
    const needingFollowUp = jobs.filter(
      (job) =>
        job.status === "applied" &&
        new Date(job.appliedDate) <= oneWeekAgo &&
        !job.followUpDate
    );

    needingFollowUp.forEach((job) => {
      suggestions.push({
        type: "follow-up",
        message: `Consider following up on your application to ${job.company}`,
        jobId: job.id,
        action: "schedule-follow-up",
      });
    });

    // Find upcoming interviews
    const upcomingInterviews = jobs.filter(
      (job) =>
        job.interviewDate &&
        new Date(job.interviewDate) >= now &&
        new Date(job.interviewDate).getTime() - now.getTime() <=
          48 * 60 * 60 * 1000
    );

    upcomingInterviews.forEach((job) => {
      suggestions.push({
        type: "interview-prep",
        message: `Prepare for your interview with ${job.company} - research the company and practice common questions`,
        jobId: job.id,
        action: "interview-prep",
      });
    });

    // Find stale applications
    const staleApplications = jobs.filter(
      (job) =>
        job.status === "interview" &&
        job.interviewDate &&
        new Date(job.interviewDate) <= oneWeekAgo
    );

    staleApplications.forEach((job) => {
      suggestions.push({
        type: "status-update",
        message: `Your interview with ${job.company} was over a week ago - consider reaching out for an update`,
        jobId: job.id,
        action: "request-update",
      });
    });

    return suggestions;
  }
}

export const notificationService = new NotificationService();
