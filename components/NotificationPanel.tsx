"use client";

import { useState, useEffect } from "react";
import {
  Bell,
  CheckCheck,
  X,
  Settings,
  Clock,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  notificationService,
  SmartNotification,
  NotificationSettings,
} from "@/lib/notificationService";
import { JobApplication } from "@/types/job";

interface NotificationPanelProps {
  jobs: JobApplication[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function NotificationPanel({
  jobs,
  open,
  onOpenChange,
}: NotificationPanelProps) {
  const [notifications, setNotifications] = useState<SmartNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [settings, setSettings] = useState<NotificationSettings>(
    notificationService.getSettings()
  );
  const [suggestions, setSuggestions] = useState<
    Array<{
      type: string;
      message: string;
      jobId?: string;
      action: string;
    }>
  >([]);
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    // Load initial data
    setNotifications(notificationService.getNotifications());
    setUnreadCount(notificationService.getUnreadCount());
    setSuggestions(notificationService.getSuggestedActions(jobs));

    // Check notification permission
    if ("Notification" in window) {
      setHasPermission(Notification.permission === "granted");
    }

    // Set up periodic refresh
    const interval = setInterval(() => {
      setNotifications(notificationService.getNotifications());
      setUnreadCount(notificationService.getUnreadCount());
      setSuggestions(notificationService.getSuggestedActions(jobs));
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [jobs]);

  const handleRequestPermission = async () => {
    const granted = await notificationService.requestPermission();
    setHasPermission(granted);
  };

  const handleMarkAsRead = (id: string) => {
    notificationService.markAsRead(id);
    setNotifications(notificationService.getNotifications());
    setUnreadCount(notificationService.getUnreadCount());
  };

  const handleMarkAllAsRead = () => {
    notificationService.markAllAsRead();
    setNotifications(notificationService.getNotifications());
    setUnreadCount(notificationService.getUnreadCount());
  };

  const handleDeleteNotification = (id: string) => {
    notificationService.deleteNotification(id);
    setNotifications(notificationService.getNotifications());
    setUnreadCount(notificationService.getUnreadCount());
  };

  const handleUpdateSettings = (newSettings: Partial<NotificationSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    notificationService.updateSettings(newSettings);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "interview":
        return <Clock className="h-4 w-4 text-blue-500" />;
      case "deadline":
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case "follow-up":
        return <Bell className="h-4 w-4 text-green-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days} day${days > 1 ? "s" : ""} ago`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    } else {
      return "Just now";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount > 9 ? "9+" : unreadCount}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Settings and Actions */}
          <div className="flex items-center justify-between pb-2 border-b">
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                >
                  <CheckCheck className="h-4 w-4 mr-2" />
                  Mark all read
                </Button>
              )}
            </div>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Notification Settings</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {!hasPermission && (
                    <Card className="p-4 bg-yellow-50 border-yellow-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">
                            Enable Browser Notifications
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Get notified even when the app is closed
                          </p>
                        </div>
                        <Button size="sm" onClick={handleRequestPermission}>
                          Enable
                        </Button>
                      </div>
                    </Card>
                  )}

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="notifications-enabled">
                        Enable Notifications
                      </Label>
                      <Switch
                        id="notifications-enabled"
                        checked={settings.enabled}
                        onCheckedChange={(checked: boolean) =>
                          handleUpdateSettings({ enabled: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="follow-up-reminders">
                        Follow-up Reminders
                      </Label>
                      <Switch
                        id="follow-up-reminders"
                        checked={settings.followUpReminders}
                        onCheckedChange={(checked: boolean) =>
                          handleUpdateSettings({
                            followUpReminders: checked,
                          })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="interview-reminders">
                        Interview Reminders
                      </Label>
                      <Switch
                        id="interview-reminders"
                        checked={settings.interviewReminders}
                        onCheckedChange={(checked: boolean) =>
                          handleUpdateSettings({
                            interviewReminders: checked,
                          })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="status-updates">Status Updates</Label>
                      <Switch
                        id="status-updates"
                        checked={settings.statusUpdates}
                        onCheckedChange={(checked: boolean) =>
                          handleUpdateSettings({ statusUpdates: checked })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="reminder-days">
                        Follow-up Reminder (days)
                      </Label>
                      <Input
                        id="reminder-days"
                        type="number"
                        min="1"
                        max="30"
                        value={settings.reminderDays}
                        onChange={(e) =>
                          handleUpdateSettings({
                            reminderDays: parseInt(e.target.value) || 7,
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="interview-reminder-hours">
                        Interview Reminder (hours before)
                      </Label>
                      <Input
                        id="interview-reminder-hours"
                        type="number"
                        min="1"
                        max="72"
                        value={settings.interviewReminderHours}
                        onChange={(e) =>
                          handleUpdateSettings({
                            interviewReminderHours:
                              parseInt(e.target.value) || 24,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Notifications List */}
        <ScrollArea className="max-h-96">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification) => (
                <Card
                  key={notification.id}
                  className={`p-3 cursor-pointer transition-colors ${
                    notification.isRead
                      ? "bg-background hover:bg-muted/50"
                      : "bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 border border-blue-200"
                  }`}
                  onClick={() => handleMarkAsRead(notification.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-2 flex-1">
                      {getNotificationIcon(notification.type)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-1">
                          {notification.title}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDate(notification.createdAt)}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteNotification(notification.id);
                      }}
                      className="h-6 w-6 p-0 ml-2 opacity-50 hover:opacity-100"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Smart Suggestions */}
        {suggestions.length > 0 && (
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-2">Smart Suggestions</h4>
            <div className="space-y-2">
              {suggestions.slice(0, 3).map((suggestion, index) => (
                <div
                  key={index}
                  className="text-xs p-2 bg-green-50 rounded border border-green-200"
                >
                  <p className="text-green-800">{suggestion.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
