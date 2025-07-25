import { FilterPreset, FilterOptions, SortOptions } from "@/types/job";

const STORAGE_KEY = "job-tracker-filter-presets";

export const filterPresetStorage = {
  getAll(): FilterPreset[] {
    if (typeof window === "undefined") return [];

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error("Error loading filter presets:", error);
      return [];
    }
  },

  add(name: string, filters: FilterOptions, sort: SortOptions): FilterPreset {
    const newPreset: FilterPreset = {
      id: crypto.randomUUID(),
      name,
      filters,
      sort,
      createdDate: new Date().toISOString(),
    };

    const presets = this.getAll();
    presets.push(newPreset);
    this.saveAll(presets);

    return newPreset;
  },

  update(id: string, updates: Partial<FilterPreset>): void {
    const presets = this.getAll();
    const index = presets.findIndex((preset) => preset.id === id);

    if (index !== -1) {
      presets[index] = { ...presets[index], ...updates };
      this.saveAll(presets);
    }
  },

  delete(id: string): void {
    const presets = this.getAll().filter((preset) => preset.id !== id);
    this.saveAll(presets);
  },

  saveAll(presets: FilterPreset[]): void {
    if (typeof window === "undefined") return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
    } catch (error) {
      console.error("Error saving filter presets:", error);
    }
  },
};
