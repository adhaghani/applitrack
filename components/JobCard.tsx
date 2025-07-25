import { JobApplication } from "@/types/job";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  DollarSign,
  ExternalLink,
  Edit,
  Trash2,
  MapPin,
  Building,
  User,
  Clock,
  Star,
  VideoIcon,
  FileText,
} from "lucide-react";

interface JobCardProps {
  job: JobApplication;
  onEdit: (job: JobApplication) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, updates: Partial<JobApplication>) => void;
  onManageDocuments?: (jobId: string) => void;
}

const statusColors = {
  applied: "bg-blue-100 text-blue-800 hover:bg-blue-200",
  shortlisted: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
  interview: "bg-purple-100 text-purple-800 hover:bg-purple-200",
  rejected: "bg-red-100 text-red-800 hover:bg-red-200",
  offered: "bg-green-100 text-green-800 hover:bg-green-200",
};

const statusLabels = {
  applied: "Applied",
  shortlisted: "Shortlisted",
  interview: "Interview",
  rejected: "Rejected",
  offered: "Offered",
};

const jobTypeColors = {
  "full-time": "bg-green-50 text-green-700 border-green-200",
  "part-time": "bg-blue-50 text-blue-700 border-blue-200",
  contract: "bg-purple-50 text-purple-700 border-purple-200",
  freelance: "bg-orange-50 text-orange-700 border-orange-200",
  internship: "bg-pink-50 text-pink-700 border-pink-200",
};

const workModeColors = {
  remote: "bg-emerald-50 text-emerald-700 border-emerald-200",
  "on-site": "bg-slate-50 text-slate-700 border-slate-200",
  hybrid: "bg-indigo-50 text-indigo-700 border-indigo-200",
};

const priorityColors = {
  low: "bg-gray-50 text-gray-600 border-gray-200",
  medium: "bg-blue-50 text-blue-600 border-blue-200",
  high: "bg-red-50 text-red-600 border-red-200",
};

export function JobCard({
  job,
  onEdit,
  onDelete,
  onStatusChange,
  onManageDocuments,
}: JobCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatSalaryRange = () => {
    if (!job.salaryRange?.min && !job.salaryRange?.max) return null;

    const currency = job.salaryRange.currency || "USD";
    const min = job.salaryRange.min ? `${currency} ${job.salaryRange.min}` : "";
    const max = job.salaryRange.max ? `${currency} ${job.salaryRange.max}` : "";

    if (min && max) return `${min} - ${max}`;
    if (min) return `${min}+`;
    if (max) return `Up to ${max}`;
    return null;
  };

  const statusOrder = [
    "applied",
    "shortlisted",
    "interview",
    "offered",
    "rejected",
  ] as const;

  const handleStatusClick = () => {
    const currentIndex = statusOrder.indexOf(job.status);
    const nextIndex = (currentIndex + 1) % statusOrder.length;
    const nextStatus = statusOrder[nextIndex];
    onStatusChange(job.id, { status: nextStatus });
  };

  return (
    <Card className="w-full hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base sm:text-lg truncate">
              {job.role}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1 truncate">
              {job.company}
            </p>
            {job.category && (
              <p className="text-xs text-muted-foreground mt-1 truncate">
                {job.category}
              </p>
            )}
          </div>
          <div className="flex flex-col sm:items-end space-y-2 flex-shrink-0">
            <div className="flex items-center space-x-2 flex-wrap gap-1">
              <Badge
                className={`${
                  statusColors[job.status]
                } cursor-pointer transition-colors text-xs`}
                onClick={handleStatusClick}
                title="Click to change status"
              >
                {statusLabels[job.status]}
              </Badge>
              {job.priority && job.priority !== "medium" && (
                <Badge
                  variant="outline"
                  className={`text-xs ${priorityColors[job.priority]}`}
                  title={`${job.priority} priority`}
                >
                  <Star className="h-3 w-3 mr-1" />
                  {job.priority}
                </Badge>
              )}
            </div>
            <div className="flex space-x-1 flex-wrap gap-1">
              <Badge
                variant="outline"
                className={`text-xs ${jobTypeColors[job.jobType]}`}
              >
                {job.jobType}
              </Badge>
              <Badge
                variant="outline"
                className={`text-xs ${workModeColors[job.workMode]}`}
              >
                {job.workMode}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">
              Applied: {formatDate(job.appliedDate)}
            </span>
          </div>

          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{job.workLocation}</span>
          </div>

          {job.experienceLevel && (
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <User className="h-4 w-4 flex-shrink-0" />
              <span className="capitalize truncate">
                {job.experienceLevel} Level
              </span>
            </div>
          )}

          {formatSalaryRange() && (
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <DollarSign className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{formatSalaryRange()}</span>
            </div>
          )}

          {job.interviewDate && (
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <VideoIcon className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">
                Interview: {formatDate(job.interviewDate)}
              </span>
            </div>
          )}

          {job.followUpDate && (
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">
                Follow up: {formatDate(job.followUpDate)}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {job.jobPostingUrl && (
            <a
              href={job.jobPostingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1 text-xs text-blue-600 hover:underline"
            >
              <Building className="h-3 w-3" />
              <span>Job Posting</span>
            </a>
          )}

          {job.interviewLink && (
            <a
              href={job.interviewLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1 text-xs text-blue-600 hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              <span>Interview Link</span>
            </a>
          )}
        </div>

        {job.notes && (
          <div className="text-sm text-muted-foreground bg-muted p-2 rounded">
            <p className="line-clamp-2">{job.notes}</p>
          </div>
        )}

        {job.documents && job.documents.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">
                Linked Documents ({job.documents.length})
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {job.documents.slice(0, 3).map((doc) => (
                <Badge
                  key={doc.id}
                  variant="outline"
                  className="text-xs"
                  title={doc.name}
                >
                  {doc.name.length > 20
                    ? `${doc.name.substring(0, 20)}...`
                    : doc.name}
                </Badge>
              ))}
              {job.documents.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{job.documents.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
        {onManageDocuments && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onManageDocuments(job.id)}
            className="w-full sm:w-auto"
          >
            <FileText className="h-4 w-4 mr-1" />
            Documents
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(job)}
          className="w-full sm:w-auto"
        >
          <Edit className="h-4 w-4 mr-1" />
          Edit
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDelete(job.id)}
          className="text-red-600 hover:text-red-700 w-full sm:w-auto"
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Delete
        </Button>
      </CardFooter>
    </Card>
  );
}
