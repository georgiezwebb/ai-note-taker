"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { OpenAiKeyStatusDTO } from "@/lib/openai-key-types";

import { OpenAiKeyForm } from "@/components/settings/openai-key-form";

export function OpenAiKeyDialog({
  open,
  onOpenChange,
  status,
  onStatusChange,
  onSaved,
  reason,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  status: OpenAiKeyStatusDTO | null;
  onStatusChange: (status: OpenAiKeyStatusDTO) => void;
  onSaved?: () => void;
  reason?: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border/60 bg-card/95 p-6 shadow-brand backdrop-blur-md sm:max-w-md">
        <DialogHeader>
          <DialogTitle>OpenAI API key</DialogTitle>
          <DialogDescription>
            {reason ??
              "Add your OpenAI key to polish notes with AI. Keys are validated when saved."}
          </DialogDescription>
        </DialogHeader>
        <OpenAiKeyForm
          status={status}
          onStatusChange={onStatusChange}
          onSaved={() => {
            onSaved?.();
            onOpenChange(false);
          }}
          idPrefix="openai-key-dialog"
        />
      </DialogContent>
    </Dialog>
  );
}
