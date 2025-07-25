export interface AccessibilityOptions {
  focusManagement: boolean;
  announcements: boolean;
  keyboardNavigation: boolean;
  highContrast: boolean;
  reducedMotion: boolean;
  screenReaderOptimized: boolean;
}

export interface FocusTrap {
  activate: () => void;
  deactivate: () => void;
  setInitialFocus: (element?: HTMLElement) => void;
}

class AccessibilityService {
  private readonly STORAGE_KEY = "applitrack-accessibility-settings";
  private options: AccessibilityOptions;
  private focusHistory: HTMLElement[] = [];
  private activeFocusTrap: FocusTrap | null = null;

  constructor() {
    this.options = this.loadOptions();
    this.initializeAccessibility();
  }

  private loadOptions(): AccessibilityOptions {
    if (typeof window === "undefined") {
      return this.getDefaultOptions();
    }

    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      return saved
        ? { ...this.getDefaultOptions(), ...JSON.parse(saved) }
        : this.getDefaultOptions();
    } catch {
      return this.getDefaultOptions();
    }
  }

  private getDefaultOptions(): AccessibilityOptions {
    return {
      focusManagement: true,
      announcements: true,
      keyboardNavigation: true,
      highContrast: false,
      reducedMotion: false,
      screenReaderOptimized: true,
    };
  }

  private saveOptions(): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.options));
  }

  private initializeAccessibility(): void {
    if (typeof window === "undefined") return;

    // Apply accessibility settings
    this.applySettings();

    // Listen for system preference changes
    this.setupMediaQueries();

    // Setup global keyboard handlers
    this.setupKeyboardHandlers();
  }

  private applySettings(): void {
    const root = document.documentElement;

    // High contrast mode
    root.classList.toggle("high-contrast", this.options.highContrast);

    // Reduced motion
    root.classList.toggle("reduced-motion", this.options.reducedMotion);

    // Screen reader optimizations
    root.classList.toggle(
      "screen-reader-optimized",
      this.options.screenReaderOptimized
    );
  }

  private setupMediaQueries(): void {
    // Detect system preferences
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );
    const prefersHighContrast = window.matchMedia("(prefers-contrast: high)");

    const updateFromSystem = () => {
      if (prefersReducedMotion.matches) {
        this.updateOption("reducedMotion", true);
      }

      if (prefersHighContrast.matches) {
        this.updateOption("highContrast", true);
      }
    };

    prefersReducedMotion.addEventListener("change", updateFromSystem);
    prefersHighContrast.addEventListener("change", updateFromSystem);

    updateFromSystem();
  }

  private setupKeyboardHandlers(): void {
    if (!this.options.keyboardNavigation) return;

    document.addEventListener("keydown", this.handleGlobalKeyDown.bind(this));
  }

  private handleGlobalKeyDown(event: KeyboardEvent): void {
    // Skip navigation - press Tab to move to main content
    if (event.key === "Tab" && !event.shiftKey && !event.ctrlKey) {
      const skipLink = document.querySelector(
        "[data-skip-link]"
      ) as HTMLElement;
      if (skipLink && document.activeElement === document.body) {
        event.preventDefault();
        skipLink.focus();
      }
    }

    // Escape key - close modals, menus, etc.
    if (event.key === "Escape") {
      this.handleEscapeKey();
    }
  }

  private handleEscapeKey(): void {
    // Close active focus trap (modals, dropdowns)
    if (this.activeFocusTrap) {
      this.activeFocusTrap.deactivate();
    }

    // Close any open popover/dropdown
    const openPopovers = document.querySelectorAll('[data-state="open"]');
    openPopovers.forEach((popover) => {
      const closeButton = popover.querySelector("[data-close]") as HTMLElement;
      if (closeButton) {
        closeButton.click();
      }
    });
  }

  // Update accessibility options
  updateOption<K extends keyof AccessibilityOptions>(
    key: K,
    value: AccessibilityOptions[K]
  ): void {
    this.options[key] = value;
    this.saveOptions();
    this.applySettings();
  }

  getOptions(): AccessibilityOptions {
    return { ...this.options };
  }

  // Focus management
  saveFocus(): void {
    if (document.activeElement && document.activeElement !== document.body) {
      this.focusHistory.push(document.activeElement as HTMLElement);
    }
  }

  restoreFocus(): void {
    const lastFocused = this.focusHistory.pop();
    if (lastFocused && lastFocused.isConnected) {
      lastFocused.focus();
    }
  }

  // Focus trap for modals and dialogs
  createFocusTrap(container: HTMLElement): FocusTrap {
    let isActive = false;
    let initialFocusElement: HTMLElement | null = null;

    const getFocusableElements = (): HTMLElement[] => {
      const focusableSelectors = [
        "button:not([disabled])",
        "input:not([disabled])",
        "textarea:not([disabled])",
        "select:not([disabled])",
        "a[href]",
        '[tabindex]:not([tabindex="-1"])',
        '[contenteditable="true"]',
      ].join(", ");

      return Array.from(
        container.querySelectorAll(focusableSelectors)
      ) as HTMLElement[];
    };

    const handleTabKey = (event: KeyboardEvent): void => {
      if (!isActive || event.key !== "Tab") return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    const activate = (): void => {
      if (isActive) return;

      isActive = true;
      this.activeFocusTrap = focusTrap;
      this.saveFocus();

      document.addEventListener("keydown", handleTabKey);

      // Set initial focus
      const focusableElements = getFocusableElements();
      const elementToFocus = initialFocusElement || focusableElements[0];
      if (elementToFocus) {
        elementToFocus.focus();
      }
    };

    const deactivate = (): void => {
      if (!isActive) return;

      isActive = false;
      this.activeFocusTrap = null;

      document.removeEventListener("keydown", handleTabKey);
      this.restoreFocus();
    };

    const setInitialFocus = (element?: HTMLElement): void => {
      initialFocusElement = element || null;
    };

    const focusTrap: FocusTrap = {
      activate,
      deactivate,
      setInitialFocus,
    };

    return focusTrap;
  }

  // Screen reader announcements
  announce(message: string, priority: "polite" | "assertive" = "polite"): void {
    if (!this.options.announcements) return;

    const announcer = this.getOrCreateAnnouncer(priority);
    announcer.textContent = message;

    // Clear after announcement
    setTimeout(() => {
      announcer.textContent = "";
    }, 1000);
  }

  private getOrCreateAnnouncer(priority: "polite" | "assertive"): HTMLElement {
    const id = `announcer-${priority}`;
    let announcer = document.getElementById(id);

    if (!announcer) {
      announcer = document.createElement("div");
      announcer.id = id;
      announcer.setAttribute("aria-live", priority);
      announcer.setAttribute("aria-atomic", "true");
      announcer.style.cssText = `
        position: absolute;
        left: -10000px;
        width: 1px;
        height: 1px;
        overflow: hidden;
      `;
      document.body.appendChild(announcer);
    }

    return announcer;
  }

  // ARIA utilities
  setAriaLabel(element: HTMLElement, label: string): void {
    element.setAttribute("aria-label", label);
  }

  setAriaDescribedBy(element: HTMLElement, describerId: string): void {
    const existing = element.getAttribute("aria-describedby");
    const ids = existing ? `${existing} ${describerId}` : describerId;
    element.setAttribute("aria-describedby", ids);
  }

  setAriaExpanded(element: HTMLElement, expanded: boolean): void {
    element.setAttribute("aria-expanded", expanded.toString());
  }

  setAriaSelected(element: HTMLElement, selected: boolean): void {
    element.setAttribute("aria-selected", selected.toString());
  }

  // Keyboard navigation helpers
  handleArrowNavigation(
    event: KeyboardEvent,
    items: HTMLElement[],
    currentIndex: number,
    options: {
      wrap?: boolean;
      horizontal?: boolean;
      onSelect?: (index: number) => void;
    } = {}
  ): number {
    const { wrap = true, horizontal = false, onSelect } = options;
    let newIndex = currentIndex;

    const isUpKey =
      event.key === "ArrowUp" || (!horizontal && event.key === "ArrowLeft");
    const isDownKey =
      event.key === "ArrowDown" || (!horizontal && event.key === "ArrowRight");
    const isLeftKey = horizontal && event.key === "ArrowLeft";
    const isRightKey = horizontal && event.key === "ArrowRight";

    if (isUpKey || isLeftKey) {
      newIndex =
        currentIndex > 0 ? currentIndex - 1 : wrap ? items.length - 1 : 0;
    } else if (isDownKey || isRightKey) {
      newIndex =
        currentIndex < items.length - 1
          ? currentIndex + 1
          : wrap
          ? 0
          : items.length - 1;
    } else if (event.key === "Home") {
      newIndex = 0;
    } else if (event.key === "End") {
      newIndex = items.length - 1;
    } else if (event.key === "Enter" || event.key === " ") {
      if (onSelect) {
        event.preventDefault();
        onSelect(currentIndex);
      }
      return currentIndex;
    }

    if (newIndex !== currentIndex) {
      event.preventDefault();
      items[newIndex]?.focus();
      if (onSelect) {
        onSelect(newIndex);
      }
    }

    return newIndex;
  }

  // Color contrast utilities
  getContrastRatio(color1: string, color2: string): number {
    const getLuminance = (color: string): number => {
      // Simple luminance calculation (would need proper color parsing in real implementation)
      return 0.5; // Placeholder
    };

    const lum1 = getLuminance(color1);
    const lum2 = getLuminance(color2);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);

    return (brightest + 0.05) / (darkest + 0.05);
  }

  meetsContrastRequirement(
    color1: string,
    color2: string,
    level: "AA" | "AAA" = "AA"
  ): boolean {
    const ratio = this.getContrastRatio(color1, color2);
    return level === "AA" ? ratio >= 4.5 : ratio >= 7;
  }

  // Cleanup
  destroy(): void {
    if (this.activeFocusTrap) {
      this.activeFocusTrap.deactivate();
    }

    this.focusHistory = [];

    // Remove event listeners
    document.removeEventListener(
      "keydown",
      this.handleGlobalKeyDown.bind(this)
    );
  }
}

export const accessibilityService = new AccessibilityService();
