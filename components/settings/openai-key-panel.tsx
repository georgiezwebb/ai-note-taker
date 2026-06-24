"use client";

import { useState } from "react";
import { ChevronDown, KeyRoundIcon } from "lucide-react";

import {
  sidebarPanelClassName,
  sidebarPanelPadding,
  sidebarTriggerClassName,
} from "@/components/dashboard/sidebar-panel-styles";
import { OpenAiKeyForm } from "@/components/settings/openai-key-form";
import { Card } from "@/components/ui/card";
import type { OpenAiKeyStatusDTO } from "@/lib/openai-key-types";
import { cn } from "@/lib/utils";

export function OpenAiKeyPanel({
  status,
  onStatusChange,
  className,
  embedded = false,
}: {
  status: OpenAiKeyStatusDTO | null;
  onStatusChange: (status: OpenAiKeyStatusDTO) => void;
  className?: string;
  embedded?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const configured = Boolean(status?.hasUserKey);
  const aiReady = Boolean(status?.aiAvailable);
  const keyCount = status?.keys.length ?? 0;

  function panelKeyLabel(): string {
    if (!configured) {
      return aiReady ? "Server" : "None";
    }
    if (keyCount === 1) {
      const key = status!.keys[0]!;
      return `${key.name} · ${key.keyHint}`;
    }
    return `${keyCount} keys`;
  }

  return (
    <Card
      className={cn(
        sidebarPanelClassName(className, embedded),
        sidebarPanelPadding(open)
      )}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls="openai-key-panel"
        onClick={() => setOpen((v) => !v)}
        className={sidebarTriggerClassName()}
      >
        <KeyRoundIcon aria-hidden className="size-4 shrink-0 text-primary" />
        <span className="min-w-0 flex-1">OpenAI key</span>
        <span
          className={cn(
            "max-w-[7rem] truncate text-xs tabular-nums",
            aiReady ? "text-muted-foreground" : "text-amber-600 dark:text-amber-400"
          )}
        >
          {panelKeyLabel()}
        </span>
        <ChevronDown
          aria-hidden
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>
      <div
        id="openai-key-panel"
        className={cn(
          "grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
        aria-hidden={!open}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="pt-3">
            <OpenAiKeyForm
              status={status}
              onStatusChange={onStatusChange}
              idPrefix="openai-key-panel"
            />
          </div>
        </div>
      </div>
    </Card>
  );
}
