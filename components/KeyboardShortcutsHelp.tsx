"use client";

import { useState } from "react";
import { keyboardService, ShortcutCategory } from "@/lib/keyboardService";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Keyboard, Command } from "lucide-react";

interface KeyboardShortcutsHelpProps {
  shortcuts: ShortcutCategory[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function KeyboardShortcutsHelp({
  shortcuts,
  open = false,
  onOpenChange,
}: KeyboardShortcutsHelpProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Keyboard className="h-4 w-4 mr-2" />
          Shortcuts
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Command className="h-5 w-5" />
            <span>Keyboard Shortcuts</span>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-96">
          <div className="space-y-6">
            {shortcuts.map((category, index) => (
              <div key={category.name}>
                {index > 0 && <Separator className="my-4" />}

                <h3 className="font-semibold text-lg mb-3">{category.name}</h3>

                <div className="space-y-2">
                  {category.shortcuts.map((shortcut, shortcutIndex) => (
                    <Card key={shortcutIndex} className="p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">{shortcut.description}</span>
                        <Badge variant="outline" className="font-mono">
                          {keyboardService.getShortcutString(shortcut)}
                        </Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="mt-4 p-3 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Tip:</strong> Press{" "}
            <Badge variant="outline" className="mx-1 font-mono">
              Ctrl + /
            </Badge>
            to open this help dialog anytime.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
