"use client";

import { SparklesIcon } from "lucide-react";

import { OpenAiKeyForm } from "@/components/settings/openai-key-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { OpenAiKeyStatusDTO } from "@/lib/openai-key-types";

export function OpenAiOnboardingDialog({
  open,
  onOpenChange,
  status,
  onStatusChange,
  onDismiss,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  status: OpenAiKeyStatusDTO | null;
  onStatusChange: (status: OpenAiKeyStatusDTO) => void;
  onDismiss: () => void | Promise<void>;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border/60 bg-card/95 p-6 shadow-brand backdrop-blur-md sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SparklesIcon aria-hidden className="size-5 text-primary" />
            Optional: connect OpenAI
          </DialogTitle>
          <DialogDescription>
            Add your own API key to use &quot;Enhance with AI&quot; when creating
            notes. You can skip this and add a key later from the dashboard
            sidebar.
          </DialogDescription>
        </DialogHeader>
        <OpenAiKeyForm
          status={status}
          onStatusChange={onStatusChange}
          onSaved={() => onOpenChange(false)}
          idPrefix="openai-onboarding"
          submitLabel="Save and continue"
        />
        <DialogFooter className="mx-0 mb-0 gap-2 border-0 bg-transparent p-0 sm:justify-end">
          <Button
            type="button"
            variant="ghost"
            onClick={async () => {
              await onDismiss();
              onOpenChange(false);
            }}
          >
            Skip for now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
