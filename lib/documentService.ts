import { Document } from "@/types/job";

export interface DocumentWithFile extends Document {
  file?: File;
  content?: string;
}

export interface DocumentCategory {
  id: string;
  name: string;
  description: string;
  allowedTypes: string[];
  maxSize: number; // in MB
}

class DocumentService {
  private readonly STORAGE_KEY = "applitrack-documents";
  private readonly CATEGORIES_KEY = "applitrack-document-categories";
  private documents: Document[] = [];
  private categories: DocumentCategory[] = [];

  constructor() {
    this.documents = this.loadDocuments();
    this.categories = this.loadCategories();
    this.initializeDefaultCategories();
  }

  private loadDocuments(): Document[] {
    if (typeof window === "undefined") return [];

    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }

  private loadCategories(): DocumentCategory[] {
    if (typeof window === "undefined") return [];

    try {
      const saved = localStorage.getItem(this.CATEGORIES_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }

  private saveDocuments(): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.documents));
  }

  private saveCategories(): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(this.CATEGORIES_KEY, JSON.stringify(this.categories));
  }

  private initializeDefaultCategories(): void {
    if (this.categories.length === 0) {
      const defaultCategories: DocumentCategory[] = [
        {
          id: "resume",
          name: "Resume",
          description: "Resume and CV documents",
          allowedTypes: [".pdf", ".doc", ".docx"],
          maxSize: 5,
        },
        {
          id: "cover-letter",
          name: "Cover Letter",
          description: "Cover letters and application letters",
          allowedTypes: [".pdf", ".doc", ".docx", ".txt"],
          maxSize: 2,
        },
        {
          id: "portfolio",
          name: "Portfolio",
          description: "Portfolio documents and work samples",
          allowedTypes: [".pdf", ".doc", ".docx", ".ppt", ".pptx", ".zip"],
          maxSize: 50,
        },
        {
          id: "certificates",
          name: "Certificates",
          description: "Certifications and educational documents",
          allowedTypes: [".pdf", ".jpg", ".jpeg", ".png"],
          maxSize: 10,
        },
        {
          id: "references",
          name: "References",
          description: "Reference letters and recommendations",
          allowedTypes: [".pdf", ".doc", ".docx"],
          maxSize: 5,
        },
        {
          id: "other",
          name: "Other",
          description: "Other supporting documents",
          allowedTypes: [
            ".pdf",
            ".doc",
            ".docx",
            ".txt",
            ".jpg",
            ".jpeg",
            ".png",
          ],
          maxSize: 10,
        },
      ];

      this.categories = defaultCategories;
      this.saveCategories();
    }
  }

  generateId(): string {
    return `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  async uploadDocument(
    file: File,
    type: Document["type"],
    jobId?: string
  ): Promise<Document | null> {
    try {
      // Validate file
      const category = this.categories.find((c) => c.id === type);
      if (!category) {
        throw new Error("Invalid document type");
      }

      const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();
      if (!category.allowedTypes.includes(fileExtension)) {
        throw new Error(
          `File type ${fileExtension} not allowed for ${category.name}`
        );
      }

      if (file.size > category.maxSize * 1024 * 1024) {
        throw new Error(`File size exceeds ${category.maxSize}MB limit`);
      }

      // Convert file to base64 for storage
      const base64Content = await this.fileToBase64(file);

      const document: Document = {
        id: this.generateId(),
        name: file.name,
        type,
        fileSize: file.size,
        mimeType: file.type,
        uploadDate: new Date().toISOString(),
        content: base64Content,
        jobId,
      };

      this.documents.push(document);
      this.saveDocuments();

      return document;
    } catch (error) {
      console.error("Failed to upload document:", error);
      return null;
    }
  }

  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  }

  getDocuments(jobId?: string): Document[] {
    if (jobId) {
      return this.documents.filter((d) => d.jobId === jobId);
    }
    return [...this.documents].sort(
      (a, b) =>
        new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
    );
  }

  getDocumentsByType(type: Document["type"], jobId?: string): Document[] {
    const filtered = this.documents.filter(
      (d) => d.type === type && (!jobId || d.jobId === jobId)
    );
    return filtered.sort(
      (a, b) =>
        new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
    );
  }

  getDocument(id: string): Document | undefined {
    return this.documents.find((d) => d.id === id);
  }

  updateDocument(id: string, updates: Partial<Document>): Document | null {
    const index = this.documents.findIndex((d) => d.id === id);
    if (index === -1) return null;

    this.documents[index] = { ...this.documents[index], ...updates };
    this.saveDocuments();
    return this.documents[index];
  }

  deleteDocument(id: string): boolean {
    const index = this.documents.findIndex((d) => d.id === id);
    if (index === -1) return false;

    this.documents.splice(index, 1);
    this.saveDocuments();
    return true;
  }

  downloadDocument(id: string): void {
    const doc = this.getDocument(id);
    if (!doc || !doc.content) return;

    try {
      const link = window.document.createElement("a");
      link.href = doc.content;
      link.download = doc.name;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
    } catch (error) {
      console.error("Failed to download document:", error);
    }
  }

  attachDocumentToJob(documentId: string, jobId: string): boolean {
    const doc = this.getDocument(documentId);
    if (!doc) return false;

    doc.jobId = jobId;
    this.saveDocuments();
    return true;
  }

  detachDocumentFromJob(documentId: string): boolean {
    const doc = this.getDocument(documentId);
    if (!doc) return false;

    delete doc.jobId;
    this.saveDocuments();
    return true;
  }

  getCategories(): DocumentCategory[] {
    return [...this.categories];
  }

  getCategory(id: string): DocumentCategory | undefined {
    return this.categories.find((c) => c.id === id);
  }

  // Get storage statistics
  getStorageStats(): {
    totalDocuments: number;
    totalSize: number;
    sizeByType: Record<string, { count: number; size: number }>;
    recentUploads: Document[];
  } {
    const totalDocuments = this.documents.length;
    const totalSize = this.documents.reduce(
      (acc, doc) => acc + (doc.fileSize || 0),
      0
    );

    const sizeByType: Record<string, { count: number; size: number }> = {};
    this.documents.forEach((doc) => {
      if (!sizeByType[doc.type]) {
        sizeByType[doc.type] = { count: 0, size: 0 };
      }
      sizeByType[doc.type].count++;
      sizeByType[doc.type].size += doc.fileSize || 0;
    });

    const recentUploads = [...this.documents]
      .sort(
        (a, b) =>
          new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
      )
      .slice(0, 5);

    return {
      totalDocuments,
      totalSize,
      sizeByType,
      recentUploads,
    };
  }

  // Search documents
  searchDocuments(query: string, jobId?: string): Document[] {
    const searchTerm = query.toLowerCase();
    const documentsToSearch = jobId
      ? this.documents.filter((d) => d.jobId === jobId)
      : this.documents;

    return documentsToSearch.filter(
      (doc) =>
        doc.name.toLowerCase().includes(searchTerm) ||
        doc.type.toLowerCase().includes(searchTerm)
    );
  }

  // Bulk operations
  deleteMultipleDocuments(ids: string[]): number {
    let deletedCount = 0;
    ids.forEach((id) => {
      if (this.deleteDocument(id)) {
        deletedCount++;
      }
    });
    return deletedCount;
  }

  // Export document metadata
  exportDocumentList(): string {
    const exportData = {
      documents: this.documents.map((doc) => ({
        id: doc.id,
        name: doc.name,
        type: doc.type,
        fileSize: doc.fileSize,
        mimeType: doc.mimeType,
        uploadDate: doc.uploadDate,
        jobId: doc.jobId,
        // Excluding content for privacy/size reasons
      })),
      exportedAt: new Date().toISOString(),
    };
    return JSON.stringify(exportData, null, 2);
  }

  // Template-based document generation
  generateDocumentFromTemplate(
    templateType: "cover-letter" | "resume",
    data: any
  ): string {
    switch (templateType) {
      case "cover-letter":
        return this.generateCoverLetterTemplate(data);
      case "resume":
        return this.generateResumeTemplate(data);
      default:
        return "";
    }
  }

  private generateCoverLetterTemplate(data: {
    recipientName?: string;
    companyName: string;
    position: string;
    applicantName: string;
    applicantEmail: string;
    applicantPhone?: string;
  }): string {
    const date = new Date().toLocaleDateString();

    return `
${data.applicantName}
${data.applicantEmail}
${data.applicantPhone || ""}

${date}

${data.recipientName ? `Dear ${data.recipientName}` : "Dear Hiring Manager"},

I am writing to express my strong interest in the ${
      data.position
    } position at ${
      data.companyName
    }. With my background and experience, I am confident that I would be a valuable addition to your team.

[Your introduction paragraph - highlight your relevant experience and why you're interested in this role]

[Your body paragraph - showcase specific achievements and skills that align with the job requirements]

[Your closing paragraph - reiterate interest and mention next steps]

Thank you for considering my application. I look forward to hearing from you soon.

Sincerely,
${data.applicantName}
    `.trim();
  }

  private generateResumeTemplate(data: {
    name: string;
    email: string;
    phone?: string;
    location?: string;
    summary?: string;
  }): string {
    return `
${data.name}
${data.email} | ${data.phone || ""} | ${data.location || ""}

PROFESSIONAL SUMMARY
${data.summary || "Professional with experience in..."}

EXPERIENCE
[Add your work experience here]

EDUCATION
[Add your education here]

SKILLS
[Add your skills here]

CERTIFICATIONS
[Add any relevant certifications here]
    `.trim();
  }
}

export const documentService = new DocumentService();
