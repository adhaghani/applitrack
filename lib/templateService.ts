import { JobApplication } from "@/types/job";

export interface ApplicationTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  isDefault: boolean;
  template: Partial<JobApplication>;
  createdAt: string;
  updatedAt: string;
  usageCount: number;
}

export interface TemplateCategory {
  id: string;
  name: string;
  description: string;
  color: string;
}

class ApplicationTemplateService {
  private readonly STORAGE_KEY = "applitrack-templates";
  private readonly CATEGORIES_KEY = "applitrack-template-categories";
  private templates: ApplicationTemplate[] = [];
  private categories: TemplateCategory[] = [];

  constructor() {
    this.templates = this.loadTemplates();
    this.categories = this.loadCategories();
    this.initializeDefaultTemplates();
  }

  private loadTemplates(): ApplicationTemplate[] {
    if (typeof window === "undefined") return [];

    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }

  private loadCategories(): TemplateCategory[] {
    if (typeof window === "undefined") return [];

    try {
      const saved = localStorage.getItem(this.CATEGORIES_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }

  private saveTemplates(): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.templates));
  }

  private saveCategories(): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(this.CATEGORIES_KEY, JSON.stringify(this.categories));
  }

  private initializeDefaultTemplates(): void {
    if (this.templates.length === 0) {
      this.createDefaultCategories();
      this.createDefaultTemplates();
    }
  }

  private createDefaultCategories(): void {
    const defaultCategories: TemplateCategory[] = [
      {
        id: "tech",
        name: "Technology",
        description: "Software development, engineering, and tech roles",
        color: "blue",
      },
      {
        id: "business",
        name: "Business",
        description: "Management, consulting, and business development",
        color: "green",
      },
      {
        id: "design",
        name: "Design & Creative",
        description: "UI/UX, graphic design, and creative roles",
        color: "purple",
      },
      {
        id: "marketing",
        name: "Marketing & Sales",
        description: "Digital marketing, sales, and growth roles",
        color: "orange",
      },
      {
        id: "startup",
        name: "Startup",
        description: "Early-stage companies and startup environments",
        color: "red",
      },
      {
        id: "remote",
        name: "Remote-First",
        description: "Fully remote or remote-friendly positions",
        color: "teal",
      },
    ];

    this.categories = defaultCategories;
    this.saveCategories();
  }

  private createDefaultTemplates(): void {
    const defaultTemplates: ApplicationTemplate[] = [
      {
        id: "senior-frontend",
        name: "Senior Frontend Developer",
        description: "Template for senior frontend engineering positions",
        category: "tech",
        isDefault: true,
        template: {
          role: "Senior Frontend Developer",
          experienceLevel: "senior",
          jobType: "full-time",
          workMode: "hybrid",
          category: "Software Engineering",
          salaryRange: {
            min: "120000",
            max: "160000",
            currency: "USD",
          },
          priority: "medium",
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        usageCount: 0,
      },
      {
        id: "fullstack-mid",
        name: "Mid-Level Full Stack Developer",
        description: "Template for mid-level full stack positions",
        category: "tech",
        isDefault: true,
        template: {
          role: "Full Stack Developer",
          experienceLevel: "mid",
          jobType: "full-time",
          workMode: "remote",
          category: "Software Engineering",
          salaryRange: {
            min: "90000",
            max: "130000",
            currency: "USD",
          },
          priority: "medium",
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        usageCount: 0,
      },
      {
        id: "product-manager",
        name: "Product Manager",
        description: "Template for product management roles",
        category: "business",
        isDefault: true,
        template: {
          role: "Product Manager",
          experienceLevel: "mid",
          jobType: "full-time",
          workMode: "hybrid",
          category: "Product Management",
          salaryRange: {
            min: "110000",
            max: "150000",
            currency: "USD",
          },
          priority: "high",
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        usageCount: 0,
      },
      {
        id: "ux-designer",
        name: "UX Designer",
        description: "Template for UX design positions",
        category: "design",
        isDefault: true,
        template: {
          role: "UX Designer",
          experienceLevel: "mid",
          jobType: "full-time",
          workMode: "hybrid",
          category: "Design",
          salaryRange: {
            min: "85000",
            max: "120000",
            currency: "USD",
          },
          priority: "medium",
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        usageCount: 0,
      },
      {
        id: "startup-engineer",
        name: "Startup Software Engineer",
        description: "Template for early-stage startup engineering roles",
        category: "startup",
        isDefault: true,
        template: {
          role: "Software Engineer",
          experienceLevel: "mid",
          jobType: "full-time",
          workMode: "on-site",
          category: "Software Engineering",
          salaryRange: {
            min: "70000",
            max: "110000",
            currency: "USD",
          },
          priority: "high",
          notes:
            "Early-stage startup with equity compensation and rapid growth potential",
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        usageCount: 0,
      },
      {
        id: "remote-developer",
        name: "Remote Developer",
        description: "Template for fully remote development positions",
        category: "remote",
        isDefault: true,
        template: {
          role: "Software Developer",
          experienceLevel: "mid",
          jobType: "full-time",
          workMode: "remote",
          category: "Software Engineering",
          workLocation: "Remote",
          salaryRange: {
            min: "95000",
            max: "135000",
            currency: "USD",
          },
          priority: "medium",
          notes: "Fully remote position with flexible hours",
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        usageCount: 0,
      },
    ];

    this.templates = defaultTemplates;
    this.saveTemplates();
  }

  generateId(): string {
    return `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  getAllTemplates(): ApplicationTemplate[] {
    return [...this.templates].sort((a, b) => {
      if (a.isDefault && !b.isDefault) return -1;
      if (!a.isDefault && b.isDefault) return 1;
      return b.usageCount - a.usageCount;
    });
  }

  getTemplatesByCategory(categoryId: string): ApplicationTemplate[] {
    return this.templates.filter((t) => t.category === categoryId);
  }

  getTemplate(id: string): ApplicationTemplate | undefined {
    return this.templates.find((t) => t.id === id);
  }

  createTemplate(
    templateData: Omit<
      ApplicationTemplate,
      "id" | "createdAt" | "updatedAt" | "usageCount"
    >
  ): ApplicationTemplate {
    const newTemplate: ApplicationTemplate = {
      ...templateData,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: 0,
    };

    this.templates.push(newTemplate);
    this.saveTemplates();
    return newTemplate;
  }

  updateTemplate(
    id: string,
    updates: Partial<ApplicationTemplate>
  ): ApplicationTemplate | null {
    const index = this.templates.findIndex((t) => t.id === id);
    if (index === -1) return null;

    this.templates[index] = {
      ...this.templates[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.saveTemplates();
    return this.templates[index];
  }

  deleteTemplate(id: string): boolean {
    const index = this.templates.findIndex((t) => t.id === id);
    if (index === -1) return false;

    // Don't allow deletion of default templates
    if (this.templates[index].isDefault) return false;

    this.templates.splice(index, 1);
    this.saveTemplates();
    return true;
  }

  useTemplate(id: string): Partial<JobApplication> | null {
    const template = this.getTemplate(id);
    if (!template) return null;

    // Increment usage count
    template.usageCount++;
    this.saveTemplates();

    // Return a copy of the template data
    return { ...template.template };
  }

  getCategories(): TemplateCategory[] {
    return [...this.categories];
  }

  createCategory(categoryData: Omit<TemplateCategory, "id">): TemplateCategory {
    const newCategory: TemplateCategory = {
      ...categoryData,
      id: `category-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };

    this.categories.push(newCategory);
    this.saveCategories();
    return newCategory;
  }

  updateCategory(
    id: string,
    updates: Partial<TemplateCategory>
  ): TemplateCategory | null {
    const index = this.categories.findIndex((c) => c.id === id);
    if (index === -1) return null;

    this.categories[index] = { ...this.categories[index], ...updates };
    this.saveCategories();
    return this.categories[index];
  }

  deleteCategory(id: string): boolean {
    const index = this.categories.findIndex((c) => c.id === id);
    if (index === -1) return false;

    // Move templates from deleted category to 'tech' category
    this.templates.forEach((template) => {
      if (template.category === id) {
        template.category = "tech";
      }
    });

    this.categories.splice(index, 1);
    this.saveCategories();
    this.saveTemplates();
    return true;
  }

  // AI-powered template suggestions based on job posting content
  suggestTemplateFromJobPosting(
    jobPostingText: string
  ): ApplicationTemplate | null {
    const text = jobPostingText.toLowerCase();

    // Simple keyword-based matching for template suggestions
    const keywords = {
      "senior-frontend": [
        "senior",
        "frontend",
        "react",
        "vue",
        "angular",
        "javascript",
        "typescript",
      ],
      "fullstack-mid": [
        "fullstack",
        "full stack",
        "backend",
        "frontend",
        "nodejs",
        "python",
        "java",
      ],
      "product-manager": [
        "product manager",
        "product",
        "roadmap",
        "strategy",
        "analytics",
      ],
      "ux-designer": [
        "ux",
        "ui",
        "designer",
        "figma",
        "sketch",
        "user experience",
      ],
      "startup-engineer": [
        "startup",
        "early stage",
        "equity",
        "fast-paced",
        "growth",
      ],
      "remote-developer": [
        "remote",
        "distributed",
        "work from home",
        "flexible",
      ],
    };

    let bestMatch = "";
    let maxScore = 0;

    Object.entries(keywords).forEach(([templateId, words]) => {
      const score = words.reduce((acc, word) => {
        return acc + (text.includes(word) ? 1 : 0);
      }, 0);

      if (score > maxScore) {
        maxScore = score;
        bestMatch = templateId;
      }
    });

    return maxScore > 0 ? this.getTemplate(bestMatch) || null : null;
  }

  // Get popular templates based on usage
  getPopularTemplates(limit: number = 5): ApplicationTemplate[] {
    return [...this.templates]
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, limit);
  }

  // Export templates for sharing
  exportTemplates(): string {
    const exportData = {
      templates: this.templates.filter((t) => !t.isDefault),
      categories: this.categories,
      exportedAt: new Date().toISOString(),
    };
    return JSON.stringify(exportData, null, 2);
  }

  // Import templates from exported data
  importTemplates(jsonData: string): {
    success: boolean;
    imported: number;
    errors: string[];
  } {
    try {
      const data = JSON.parse(jsonData);
      const errors: string[] = [];
      let imported = 0;

      // Import categories first
      if (data.categories && Array.isArray(data.categories)) {
        data.categories.forEach((category: any) => {
          if (
            category.id &&
            category.name &&
            !this.categories.find((c) => c.id === category.id)
          ) {
            this.categories.push(category);
            imported++;
          }
        });
      }

      // Import templates
      if (data.templates && Array.isArray(data.templates)) {
        data.templates.forEach((template: any) => {
          if (
            template.id &&
            template.name &&
            !this.templates.find((t) => t.id === template.id)
          ) {
            // Generate new ID to avoid conflicts
            template.id = this.generateId();
            template.isDefault = false;
            template.usageCount = 0;
            template.createdAt = new Date().toISOString();
            template.updatedAt = new Date().toISOString();

            this.templates.push(template);
            imported++;
          } else {
            errors.push(
              `Template ${
                template.name || "unknown"
              } already exists or is invalid`
            );
          }
        });
      }

      this.saveTemplates();
      this.saveCategories();

      return { success: true, imported, errors };
    } catch (error) {
      return {
        success: false,
        imported: 0,
        errors: [`Failed to parse import data: ${error}`],
      };
    }
  }
}

export const templateService = new ApplicationTemplateService();
