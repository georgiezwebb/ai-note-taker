import { cn } from "@/lib/utils";

/** Shared chrome for dashboard sidebar sections (OpenAI, pinned, calendar). */
export function sidebarPanelClassName(
  className?: string,
  embedded = false
) {
  return cn(
    embedded
      ? "rounded-none border-0 bg-transparent shadow-none ring-0"
      : "border-border/50 bg-card/95 shadow-sm backdrop-blur-sm",
    "overflow-hidden border-border/60",
    className
  );
}

export function sidebarPanelPadding(open: boolean) {
  return open ? "px-3 py-3" : "px-3 py-2.5";
}

export function sidebarTriggerClassName() {
  return cn(
    "flex min-w-0 flex-1 items-center gap-2 rounded-md text-left text-sm font-medium text-foreground outline-none transition-colors",
    "hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
  );
}
