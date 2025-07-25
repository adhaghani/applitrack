"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DocumentManager } from "@/components/DocumentManager";
import { Upload } from "lucide-react";

interface DocumentManagerDialogProps {
  jobId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children?: React.ReactNode;
}

export function DocumentManagerDialog({
  jobId,
  open,
  onOpenChange,
  children,
}: DocumentManagerDialogProps) {
  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="max-w-6xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Upload className="h-5 w-5" />
            <span>Document Manager</span>
            {jobId && (
              <Badge variant="secondary" className="ml-2">
                Job-specific
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            {jobId
              ? "Manage documents for this specific job application"
              : "Upload and manage your application documents, resumes, and cover letters"}
          </DialogDescription>
        </DialogHeader>

        <DocumentManager
          jobId={jobId}
          isOpen={open}
          onOpenChange={handleOpenChange}
        />
      </DialogContent>
    </Dialog>
  );
}
