"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  templateService,
  ApplicationTemplate,
  TemplateCategory,
} from "@/lib/templateService";
import { JobApplication } from "@/types/job";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText,
  Plus,
  Star,
  Download,
  Upload,
  Trash2,
  Edit,
  Copy,
  Sparkles,
} from "lucide-react";

const templateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  category: z.string().min(1, "Category is required"),
  role: z.string().min(1, "Role is required"),
  experienceLevel: z.enum(["entry", "mid", "senior", "lead", "executive"]),
  jobType: z.enum([
    "full-time",
    "part-time",
    "contract",
    "freelance",
    "internship",
  ]),
  workMode: z.enum(["remote", "on-site", "hybrid"]),
  workLocation: z.string().optional(),
  categoryType: z.string().optional(),
  salaryMin: z.string().optional(),
  salaryMax: z.string().optional(),
  salaryCurrency: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  notes: z.string().optional(),
});

type TemplateFormData = z.infer<typeof templateSchema>;

interface TemplateManagerProps {
  onApplyTemplate: (templateData: Partial<JobApplication>) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TemplateManager({
  onApplyTemplate,
  isOpen,
  onOpenChange,
}: TemplateManagerProps) {
  const [templates, setTemplates] = useState<ApplicationTemplate[]>([]);
  const [categories, setCategories] = useState<TemplateCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] =
    useState<ApplicationTemplate | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importData, setImportData] = useState("");

  const form = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      experienceLevel: "mid",
      jobType: "full-time",
      workMode: "hybrid",
      priority: "medium",
      salaryCurrency: "USD",
    },
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setTemplates(templateService.getAllTemplates());
    setCategories(templateService.getCategories());
  };

  const filteredTemplates =
    selectedCategory === "all"
      ? templates
      : templates.filter((t) => t.category === selectedCategory);

  const handleCreateTemplate = (data: TemplateFormData) => {
    const templateData: Partial<JobApplication> = {
      role: data.role,
      experienceLevel: data.experienceLevel,
      jobType: data.jobType,
      workMode: data.workMode,
      workLocation: data.workLocation || "",
      category: data.categoryType,
      priority: data.priority,
      notes: data.notes,
      salaryRange: {
        min: data.salaryMin,
        max: data.salaryMax,
        currency: data.salaryCurrency,
      },
    };

    if (editingTemplate) {
      templateService.updateTemplate(editingTemplate.id, {
        name: data.name,
        description: data.description,
        category: data.category,
        template: templateData,
      });
      setEditingTemplate(null);
    } else {
      templateService.createTemplate({
        name: data.name,
        description: data.description,
        category: data.category,
        isDefault: false,
        template: templateData,
      });
    }

    loadData();
    setCreateDialogOpen(false);
    form.reset();
  };

  const handleApplyTemplate = (template: ApplicationTemplate) => {
    const templateData = templateService.useTemplate(template.id);
    if (templateData) {
      onApplyTemplate(templateData);
      onOpenChange(false);
      loadData(); // Refresh to update usage count
    }
  };

  const handleEditTemplate = (template: ApplicationTemplate) => {
    setEditingTemplate(template);
    form.reset({
      name: template.name,
      description: template.description,
      category: template.category,
      role: template.template.role || "",
      experienceLevel: template.template.experienceLevel || "mid",
      jobType: template.template.jobType || "full-time",
      workMode: template.template.workMode || "hybrid",
      workLocation: template.template.workLocation || "",
      categoryType: template.template.category || "",
      salaryMin: template.template.salaryRange?.min || "",
      salaryMax: template.template.salaryRange?.max || "",
      salaryCurrency: template.template.salaryRange?.currency || "USD",
      priority: template.template.priority || "medium",
      notes: template.template.notes || "",
    });
    setCreateDialogOpen(true);
  };

  const handleDeleteTemplate = (id: string) => {
    templateService.deleteTemplate(id);
    loadData();
  };

  const handleExportTemplates = () => {
    const exportData = templateService.exportTemplates();
    const blob = new Blob([exportData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `applitrack-templates-${
      new Date().toISOString().split("T")[0]
    }.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportTemplates = () => {
    if (!importData.trim()) return;

    const result = templateService.importTemplates(importData);
    if (result.success) {
      loadData();
      setImportDialogOpen(false);
      setImportData("");
      // Show success message
    } else {
      // Show error message
      console.error("Import failed:", result.errors);
    }
  };

  const getCategoryColor = (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId);
    return category?.color || "gray";
  };

  const popularTemplates = templates
    .filter((t) => t.usageCount > 0)
    .sort((a, b) => b.usageCount - a.usageCount)
    .slice(0, 3);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Application Templates</span>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="browse" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="browse">Browse Templates</TabsTrigger>
            <TabsTrigger value="popular">Popular</TabsTrigger>
            <TabsTrigger value="manage">Manage</TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Select
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Dialog
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    New Template
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>
                      {editingTemplate ? "Edit Template" : "Create Template"}
                    </DialogTitle>
                  </DialogHeader>

                  <Form {...form}>
                    <form
                      onSubmit={form.handleSubmit(handleCreateTemplate)}
                      className="space-y-4"
                    >
                      <ScrollArea className="h-96 pr-4">
                        <div className="space-y-4">
                          <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Template Name</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="e.g., Senior Frontend Developer"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder="Template description..."
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
                                <FormLabel>Category</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {categories.map((category) => (
                                      <SelectItem
                                        key={category.id}
                                        value={category.id}
                                      >
                                        {category.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="role"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Role</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Job role/title"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="experienceLevel"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Experience Level</FormLabel>
                                  <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="entry">
                                        Entry
                                      </SelectItem>
                                      <SelectItem value="mid">Mid</SelectItem>
                                      <SelectItem value="senior">
                                        Senior
                                      </SelectItem>
                                      <SelectItem value="lead">Lead</SelectItem>
                                      <SelectItem value="executive">
                                        Executive
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="jobType"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Job Type</FormLabel>
                                  <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="full-time">
                                        Full-time
                                      </SelectItem>
                                      <SelectItem value="part-time">
                                        Part-time
                                      </SelectItem>
                                      <SelectItem value="contract">
                                        Contract
                                      </SelectItem>
                                      <SelectItem value="freelance">
                                        Freelance
                                      </SelectItem>
                                      <SelectItem value="internship">
                                        Internship
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={form.control}
                            name="workMode"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Work Mode</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="remote">
                                      Remote
                                    </SelectItem>
                                    <SelectItem value="on-site">
                                      On-site
                                    </SelectItem>
                                    <SelectItem value="hybrid">
                                      Hybrid
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="grid grid-cols-3 gap-2">
                            <FormField
                              control={form.control}
                              name="salaryMin"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Min Salary</FormLabel>
                                  <FormControl>
                                    <Input placeholder="70000" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="salaryMax"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Max Salary</FormLabel>
                                  <FormControl>
                                    <Input placeholder="100000" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="salaryCurrency"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Currency</FormLabel>
                                  <FormControl>
                                    <Input placeholder="USD" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Notes</FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder="Template notes..."
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </ScrollArea>

                      <div className="flex justify-end space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setCreateDialogOpen(false);
                            setEditingTemplate(null);
                            form.reset();
                          }}
                        >
                          Cancel
                        </Button>
                        <Button type="submit">
                          {editingTemplate ? "Update" : "Create"} Template
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>

            <ScrollArea className="h-96">
              <div className="grid gap-3">
                {filteredTemplates.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No templates found</p>
                  </div>
                ) : (
                  filteredTemplates.map((template) => (
                    <Card key={template.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="font-medium truncate">
                              {template.name}
                            </h4>
                            <Badge
                              variant="secondary"
                              className={`text-xs bg-${getCategoryColor(
                                template.category
                              )}-100 text-${getCategoryColor(
                                template.category
                              )}-800`}
                            >
                              {categories.find(
                                (c) => c.id === template.category
                              )?.name || template.category}
                            </Badge>
                            {template.isDefault && (
                              <Badge variant="outline" className="text-xs">
                                <Star className="h-3 w-3 mr-1" />
                                Default
                              </Badge>
                            )}
                          </div>

                          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                            {template.description}
                          </p>

                          <div className="flex items-center text-xs text-muted-foreground">
                            <span>{template.template.role}</span>
                            <span className="mx-2">•</span>
                            <span>{template.template.experienceLevel}</span>
                            <span className="mx-2">•</span>
                            <span>{template.template.workMode}</span>
                            {template.usageCount > 0 && (
                              <>
                                <span className="mx-2">•</span>
                                <span>Used {template.usageCount} times</span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-1 ml-4">
                          <Button
                            size="sm"
                            onClick={() => handleApplyTemplate(template)}
                            className="h-8"
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            Use
                          </Button>

                          {!template.isDefault && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEditTemplate(template)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  handleDeleteTemplate(template.id)
                                }
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive-foreground hover:bg-destructive"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="popular" className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <Sparkles className="h-5 w-5 text-yellow-500" />
              <h3 className="font-medium">Most Used Templates</h3>
            </div>

            <ScrollArea className="h-96">
              <div className="grid gap-3">
                {popularTemplates.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Star className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No popular templates yet</p>
                    <p className="text-xs">
                      Templates will appear here once you start using them
                    </p>
                  </div>
                ) : (
                  popularTemplates.map((template) => (
                    <Card key={template.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="font-medium truncate">
                              {template.name}
                            </h4>
                            <Badge variant="secondary" className="text-xs">
                              {template.usageCount} uses
                            </Badge>
                          </div>

                          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                            {template.description}
                          </p>

                          <div className="flex items-center text-xs text-muted-foreground">
                            <span>{template.template.role}</span>
                            <span className="mx-2">•</span>
                            <span>{template.template.experienceLevel}</span>
                            <span className="mx-2">•</span>
                            <span>{template.template.workMode}</span>
                          </div>
                        </div>

                        <Button
                          size="sm"
                          onClick={() => handleApplyTemplate(template)}
                          className="h-8 ml-4"
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Use
                        </Button>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="manage" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Import & Export</h3>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportTemplates}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Templates
                </Button>

                <Dialog
                  open={importDialogOpen}
                  onOpenChange={setImportDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Upload className="h-4 w-4 mr-2" />
                      Import Templates
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Import Templates</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Textarea
                        placeholder="Paste exported template JSON here..."
                        value={importData}
                        onChange={(e) => setImportData(e.target.value)}
                        rows={10}
                      />
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          onClick={() => setImportDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button onClick={handleImportTemplates}>Import</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <Card className="p-4">
              <h4 className="font-medium mb-2">Template Statistics</h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Total Templates</p>
                  <p className="text-2xl font-bold">{templates.length}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Custom Templates</p>
                  <p className="text-2xl font-bold">
                    {templates.filter((t) => !t.isDefault).length}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total Uses</p>
                  <p className="text-2xl font-bold">
                    {templates.reduce((acc, t) => acc + t.usageCount, 0)}
                  </p>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
