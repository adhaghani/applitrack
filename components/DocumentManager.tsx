"use client";

import { useState, useEffect, useRef } from "react";
import { documentService, DocumentCategory } from "@/lib/documentService";
import { Document } from "@/types/job";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Upload,
  FileText,
  Download,
  Trash2,
  Search,
  Filter,
  Plus,
  Paperclip,
  FileType,
  Calendar,
  HardDrive,
} from "lucide-react";

interface DocumentManagerProps {
  jobId?: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onDocumentSelect?: (document: Document) => void;
}

export function DocumentManager({
  jobId,
  isOpen,
  onOpenChange,
  onDocumentSelect,
}: DocumentManagerProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [uploading, setUploading] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, [jobId]);

  const loadData = () => {
    setDocuments(documentService.getDocuments(jobId));
    setCategories(documentService.getCategories());
  };

  const filteredDocuments = documents.filter((doc) => {
    const matchesCategory =
      selectedCategory === "all" || doc.type === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.type.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleFileUpload = async (files: FileList, type: Document["type"]) => {
    setUploading(true);

    try {
      for (const file of Array.from(files)) {
        await documentService.uploadDocument(file, type, jobId);
      }
      loadData();
    } catch (error) {
      console.error("Failed to upload files:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = (id: string) => {
    documentService.deleteDocument(id);
    loadData();
  };

  const handleDeleteSelected = () => {
    const deletedCount =
      documentService.deleteMultipleDocuments(selectedDocuments);
    setSelectedDocuments([]);
    loadData();
  };

  const handleDownloadDocument = (id: string) => {
    documentService.downloadDocument(id);
  };

  const handleDocumentSelect = (document: Document) => {
    if (onDocumentSelect) {
      onDocumentSelect(document);
    }
  };

  const toggleDocumentSelection = (id: string) => {
    setSelectedDocuments((prev) =>
      prev.includes(id) ? prev.filter((docId) => docId !== id) : [...prev, id]
    );
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "resume":
        return <FileText className="h-4 w-4 text-blue-500" />;
      case "cover-letter":
        return <FileText className="h-4 w-4 text-green-500" />;
      case "portfolio":
        return <FileType className="h-4 w-4 text-purple-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const stats = documentService.getStorageStats();

  return (
    <div className="space-y-4 w-full">
      <Tabs defaultValue="documents" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 w-full sm:w-64"
                />
              </div>

              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedDocuments.length > 0 && (
              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <span className="text-sm text-muted-foreground">
                  {selectedDocuments.length} selected
                </span>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteSelected}
                  className="flex-1 sm:flex-none"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Selected
                </Button>
              </div>
            )}
          </div>

          <ScrollArea className="h-[400px]">
            {filteredDocuments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No documents found</p>
                <p className="text-sm">Upload some documents to get started</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {filteredDocuments.map((document) => (
                  <Card
                    key={document.id}
                    className={`p-4 cursor-pointer transition-colors ${
                      selectedDocuments.includes(document.id)
                        ? "bg-blue-900/10 border-blue-200"
                        : "hover:bg-muted/50"
                    }`}
                    onClick={() => toggleDocumentSelection(document.id)}
                  >
                    <div className="flex items-start justify-between min-w-0">
                      <div className="flex items-start space-x-3 flex-1 min-w-0">
                        <div className="mt-1 flex-shrink-0">
                          {getTypeIcon(document.type)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1 min-w-0">
                            <h4
                              className="font-medium w-24 truncate min-w-0"
                              title={document.name}
                            >
                              {document.name}
                            </h4>
                            <Badge
                              variant="outline"
                              className="text-xs flex-shrink-0"
                            >
                              {categories.find((c) => c.id === document.type)
                                ?.name || document.type}
                            </Badge>
                          </div>

                          <div className="flex items-center space-x-2 sm:space-x-4 text-xs text-muted-foreground flex-wrap gap-1">
                            {document.fileSize && (
                              <span className="flex items-center space-x-1 whitespace-nowrap">
                                <HardDrive className="h-3 w-3" />
                                <span>{formatFileSize(document.fileSize)}</span>
                              </span>
                            )}
                            <span className="flex items-center space-x-1 whitespace-nowrap">
                              <Calendar className="h-3 w-3" />
                              <span>{formatDate(document.uploadDate)}</span>
                            </span>
                            {document.mimeType && (
                              <span className="whitespace-nowrap">
                                {document.mimeType.split("/")[1]?.toUpperCase()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1 ml-2 flex-shrink-0">
                        {onDocumentSelect && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDocumentSelect(document);
                            }}
                            className="h-8 text-xs px-2"
                          >
                            Select
                          </Button>
                        )}

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadDocument(document.id);
                          }}
                          className="h-8 w-8 p-0"
                          title="Download document"
                        >
                          <Download className="h-3 w-3" />
                        </Button>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteDocument(document.id);
                          }}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive-foreground hover:bg-destructive"
                          title="Delete document"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="upload" className="space-y-4">
          <ScrollArea className="h-[400px]">
            <div className="grid gap-4">
              {categories.map((category) => (
                <Card key={category.id} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium">{category.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {category.description}
                      </p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                        <span>Max size: {category.maxSize}MB</span>
                        <span>Types: {category.allowedTypes.join(", ")}</span>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const input = document.createElement("input");
                        input.type = "file";
                        input.multiple = true;
                        input.accept = category.allowedTypes.join(",");
                        input.onchange = (e) => {
                          const files = (e.target as HTMLInputElement).files;
                          if (files) {
                            handleFileUpload(
                              files,
                              category.id as Document["type"]
                            );
                          }
                        };
                        input.click();
                      }}
                      disabled={uploading}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload {category.name}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>

            <div className="mt-6 p-4 border-2 border-dashed border-muted-foreground/25 rounded-lg text-center">
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                You can also drag and drop files here
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Files will be automatically categorized based on their type
              </p>
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          <ScrollArea className="h-[400px]">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <FileText className="h-5 w-5 text-blue-500" />
                    <span className="font-medium">Total Documents</span>
                  </div>
                  <p className="text-2xl font-bold">{stats.totalDocuments}</p>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <HardDrive className="h-5 w-5 text-green-500" />
                    <span className="font-medium">Total Size</span>
                  </div>
                  <p className="text-2xl font-bold">
                    {formatFileSize(stats.totalSize)}
                  </p>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <FileType className="h-5 w-5 text-purple-500" />
                    <span className="font-medium">Document Types</span>
                  </div>
                  <p className="text-2xl font-bold">
                    {Object.keys(stats.sizeByType).length}
                  </p>
                </Card>
              </div>

              <Card className="p-4">
                <h4 className="font-medium mb-3">Storage by Type</h4>
                <div className="space-y-3">
                  {Object.entries(stats.sizeByType).map(([type, data]) => (
                    <div
                      key={type}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-2">
                        {getTypeIcon(type)}
                        <span className="capitalize">
                          {categories.find((c) => c.id === type)?.name || type}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {data.count} files • {formatFileSize(data.size)}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {stats.recentUploads.length > 0 && (
                <Card className="p-4">
                  <h4 className="font-medium mb-3">Recent Uploads</h4>
                  <div className="space-y-2">
                    {stats.recentUploads.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between text-sm min-w-0"
                      >
                        <div className="flex items-center space-x-2 min-w-0 flex-1">
                          <div className="flex-shrink-0">
                            {getTypeIcon(doc.type)}
                          </div>

                          <span className="truncate" title={doc.name}>
                            {doc.name}
                          </span>
                        </div>
                        <span className="text-muted-foreground flex-shrink-0 ml-2 text-xs">
                          {formatDate(doc.uploadDate)}
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
