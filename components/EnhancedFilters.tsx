"use client";

import { useState, useEffect } from "react";
import { FilterOptions, SortOptions, FilterPreset } from "@/types/job";
import { filterPresetStorage } from "@/lib/filterPresetStorage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Filter,
  X,
  ArrowUpDown,
  Save,
  Bookmark,
  Search,
  Calendar,
  DollarSign,
  MapPin,
  Star,
} from "lucide-react";

interface EnhancedFiltersProps {
  filters: FilterOptions;
  sort: SortOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  onSortChange: (sort: SortOptions) => void;
  onClearFilters: () => void;
  categories: string[];
  searchTerm: string;
  onSearchChange: (search: string) => void;
}

export function EnhancedFilters({
  filters,
  sort,
  onFiltersChange,
  onSortChange,
  onClearFilters,
  categories,
  searchTerm,
  onSearchChange,
}: EnhancedFiltersProps) {
  const [open, setOpen] = useState(false);
  const [presets, setPresets] = useState<FilterPreset[]>([]);
  const [showSavePreset, setShowSavePreset] = useState(false);
  const [presetName, setPresetName] = useState("");
  const [salaryRange, setSalaryRange] = useState([0, 300000]);

  useEffect(() => {
    setPresets(filterPresetStorage.getAll());
  }, []);

  const activeFiltersCount = Object.keys(filters).filter(
    (key) =>
      filters[key as keyof FilterOptions] &&
      filters[key as keyof FilterOptions] !== "all"
  ).length;

  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value === "all" ? undefined : value,
    });
  };

  const handleSalaryRangeChange = (value: number[]) => {
    setSalaryRange(value);
    handleFilterChange("salaryRange", {
      min: value[0],
      max: value[1],
    });
  };

  const saveFilterPreset = () => {
    if (!presetName.trim()) return;

    const newPreset = filterPresetStorage.add(presetName, filters, sort);
    setPresets([...presets, newPreset]);
    setPresetName("");
    setShowSavePreset(false);
  };

  const loadFilterPreset = (preset: FilterPreset) => {
    onFiltersChange(preset.filters);
    onSortChange(preset.sort);
  };

  const deleteFilterPreset = (id: string) => {
    filterPresetStorage.delete(id);
    setPresets(presets.filter((p) => p.id !== id));
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center w-full">
      {/* Enhanced Search - Now always visible for mobile */}
      <div className="relative flex-1 max-w-full sm:max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search jobs, companies, notes..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Mobile-optimized controls */}
      <div className="flex gap-2 items-center flex-wrap sm:flex-nowrap">
        {/* Filter Presets */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="flex-shrink-0">
              <Bookmark className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Presets</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Saved Filters</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSavePreset(!showSavePreset)}
                >
                  <Save className="h-3 w-3" />
                </Button>
              </div>

              {showSavePreset && (
                <div className="space-y-2 p-2 border rounded">
                  <Input
                    placeholder="Preset name"
                    value={presetName}
                    onChange={(e) => setPresetName(e.target.value)}
                  />
                  <div className="flex gap-1">
                    <Button size="sm" onClick={saveFilterPreset}>
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowSavePreset(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              <ScrollArea className="max-h-48">
                {presets.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-2">
                    No saved presets
                  </p>
                ) : (
                  <div className="space-y-1">
                    {presets.map((preset) => (
                      <div key={preset.id} className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex-1 justify-start"
                          onClick={() => loadFilterPreset(preset)}
                        >
                          {preset.name}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteFilterPreset(preset.id)}
                          className="p-1 h-6 w-6"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </PopoverContent>
        </Popover>

        {/* Advanced Filters Dialog */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="relative flex-shrink-0">
              <Filter className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Advanced</span>
              <span className="sm:hidden">Filters</span>
              {activeFiltersCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-[600px] max-h-[90vh] w-[95vw] sm:w-full mx-2 sm:mx-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between text-base sm:text-lg">
                Advanced Filters & Sorting
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClearFilters}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Clear All</span>
                </Button>
              </DialogTitle>
            </DialogHeader>

            <ScrollArea className="h-[calc(90vh-120px)]">
              <div className="space-y-4 sm:space-y-6 pr-2 sm:pr-4">
                {/* Sorting */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium flex items-center">
                    <ArrowUpDown className="h-4 w-4 mr-2" />
                    Sort By
                  </Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Select
                      value={sort.field}
                      onValueChange={(value) =>
                        onSortChange({
                          ...sort,
                          field: value as SortOptions["field"],
                        })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="appliedDate">
                          Applied Date
                        </SelectItem>
                        <SelectItem value="company">Company</SelectItem>
                        <SelectItem value="role">Role</SelectItem>
                        <SelectItem value="status">Status</SelectItem>
                        <SelectItem value="interviewDate">
                          Interview Date
                        </SelectItem>
                        <SelectItem value="priority">Priority</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select
                      value={sort.order}
                      onValueChange={(value) =>
                        onSortChange({
                          ...sort,
                          order: value as SortOptions["order"],
                        })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="desc">Newest First</SelectItem>
                        <SelectItem value="asc">Oldest First</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Basic Filters */}
                <div className="space-y-4">
                  <Label className="text-sm font-medium flex items-center">
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                  </Label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select
                        value={filters.status || "all"}
                        onValueChange={(value) =>
                          handleFilterChange("status", value)
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Statuses</SelectItem>
                          <SelectItem value="applied">Applied</SelectItem>
                          <SelectItem value="shortlisted">
                            Shortlisted
                          </SelectItem>
                          <SelectItem value="interview">Interview</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                          <SelectItem value="offered">Offered</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Job Type</Label>
                      <Select
                        value={filters.jobType || "all"}
                        onValueChange={(value) =>
                          handleFilterChange("jobType", value)
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Types</SelectItem>
                          <SelectItem value="full-time">Full-time</SelectItem>
                          <SelectItem value="part-time">Part-time</SelectItem>
                          <SelectItem value="contract">Contract</SelectItem>
                          <SelectItem value="freelance">Freelance</SelectItem>
                          <SelectItem value="internship">Internship</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Work Mode</Label>
                      <Select
                        value={filters.workMode || "all"}
                        onValueChange={(value) =>
                          handleFilterChange("workMode", value)
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Modes</SelectItem>
                          <SelectItem value="remote">Remote</SelectItem>
                          <SelectItem value="on-site">On-site</SelectItem>
                          <SelectItem value="hybrid">Hybrid</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Experience Level</Label>
                      <Select
                        value={filters.experienceLevel || "all"}
                        onValueChange={(value) =>
                          handleFilterChange("experienceLevel", value)
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Levels</SelectItem>
                          <SelectItem value="entry">Entry</SelectItem>
                          <SelectItem value="mid">Mid</SelectItem>
                          <SelectItem value="senior">Senior</SelectItem>
                          <SelectItem value="lead">Lead</SelectItem>
                          <SelectItem value="executive">Executive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Priority Filter */}
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select
                      value={filters.priority || "all"}
                      onValueChange={(value) =>
                        handleFilterChange("priority", value)
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Priorities</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Salary Range Filter with improved mobile layout */}
                  <div className="space-y-3">
                    <Label className="flex items-center">
                      <DollarSign className="h-4 w-4 mr-2" />
                      Salary Range: ${salaryRange[0].toLocaleString()} - $
                      {salaryRange[1].toLocaleString()}
                    </Label>
                    <div className="px-2">
                      <Slider
                        value={salaryRange}
                        onValueChange={handleSalaryRangeChange}
                        max={300000}
                        min={0}
                        step={5000}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>$0</span>
                        <span>$300K</span>
                      </div>
                    </div>
                  </div>

                  {/* Location Filter */}
                  <div className="space-y-2">
                    <Label className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2" />
                      Location
                    </Label>
                    <Input
                      placeholder="Filter by location..."
                      value={filters.location || ""}
                      onChange={(e) =>
                        handleFilterChange("location", e.target.value)
                      }
                    />
                  </div>

                  {/* Category Filter */}
                  {categories.length > 0 && (
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select
                        value={filters.category || "all"}
                        onValueChange={(value) =>
                          handleFilterChange("category", value)
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Categories</SelectItem>
                          {categories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setOpen(false)}
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => setOpen(false)}
                    className="w-full sm:w-auto"
                  >
                    Apply Filters
                  </Button>
                </div>
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
