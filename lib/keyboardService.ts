import { useEffect, useCallback } from "react";

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  metaKey?: boolean;
  action: () => void;
  description: string;
}

export interface ShortcutCategory {
  name: string;
  shortcuts: KeyboardShortcut[];
}

class KeyboardShortcutService {
  private shortcuts: Map<string, KeyboardShortcut> = new Map();
  private isEnabled = true;

  constructor() {
    this.setupGlobalListener();
  }

  private setupGlobalListener() {
    if (typeof window === "undefined") return;

    document.addEventListener("keydown", this.handleKeyDown.bind(this));
  }

  private handleKeyDown(event: KeyboardEvent) {
    if (!this.isEnabled) return;

    // Don't trigger shortcuts when typing in inputs, textareas, or contenteditable elements
    const target = event.target as HTMLElement;
    if (
      target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.contentEditable === "true" ||
      target.closest('[contenteditable="true"]')
    ) {
      return;
    }

    const shortcutKey = this.getShortcutKey(event);
    const shortcut = this.shortcuts.get(shortcutKey);

    if (shortcut) {
      event.preventDefault();
      event.stopPropagation();
      shortcut.action();
    }
  }

  private getShortcutKey(event: KeyboardEvent): string {
    const parts = [];

    if (event.ctrlKey) parts.push("ctrl");
    if (event.altKey) parts.push("alt");
    if (event.shiftKey) parts.push("shift");
    if (event.metaKey) parts.push("meta");

    parts.push(event.key.toLowerCase());

    return parts.join("+");
  }

  register(shortcut: KeyboardShortcut): void {
    const key = this.getShortcutKeyFromShortcut(shortcut);
    this.shortcuts.set(key, shortcut);
  }

  unregister(shortcut: KeyboardShortcut): void {
    const key = this.getShortcutKeyFromShortcut(shortcut);
    this.shortcuts.delete(key);
  }

  private getShortcutKeyFromShortcut(shortcut: KeyboardShortcut): string {
    const parts = [];

    if (shortcut.ctrlKey) parts.push("ctrl");
    if (shortcut.altKey) parts.push("alt");
    if (shortcut.shiftKey) parts.push("shift");
    if (shortcut.metaKey) parts.push("meta");

    parts.push(shortcut.key.toLowerCase());

    return parts.join("+");
  }

  enable(): void {
    this.isEnabled = true;
  }

  disable(): void {
    this.isEnabled = false;
  }

  getAllShortcuts(): KeyboardShortcut[] {
    return Array.from(this.shortcuts.values());
  }

  getShortcutString(shortcut: KeyboardShortcut): string {
    const parts = [];

    if (shortcut.metaKey) parts.push("⌘");
    if (shortcut.ctrlKey) parts.push("Ctrl");
    if (shortcut.altKey) parts.push("Alt");
    if (shortcut.shiftKey) parts.push("Shift");

    parts.push(shortcut.key.toUpperCase());

    return parts.join(" + ");
  }

  destroy(): void {
    if (typeof window !== "undefined") {
      document.removeEventListener("keydown", this.handleKeyDown.bind(this));
    }
    this.shortcuts.clear();
  }
}

export const keyboardService = new KeyboardShortcutService();

// React hook for using keyboard shortcuts
export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  useEffect(() => {
    shortcuts.forEach((shortcut) => {
      keyboardService.register(shortcut);
    });

    return () => {
      shortcuts.forEach((shortcut) => {
        keyboardService.unregister(shortcut);
      });
    };
  }, [shortcuts]);
}

// React hook for a single keyboard shortcut
export function useKeyboardShortcut(
  key: string,
  action: () => void,
  options: {
    ctrlKey?: boolean;
    altKey?: boolean;
    shiftKey?: boolean;
    metaKey?: boolean;
    description?: string;
  } = {}
) {
  const shortcut = useCallback(
    (): KeyboardShortcut => ({
      key,
      action,
      description: options.description || `${key} shortcut`,
      ...options,
    }),
    [key, action, options]
  );

  useKeyboardShortcuts([shortcut()]);
}
