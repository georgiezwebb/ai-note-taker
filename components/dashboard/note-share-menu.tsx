"use client";

import type { LucideIcon } from "lucide-react";
import { useState } from "react";
import {
  AtSignIcon,
  CheckIcon,
  CopyIcon,
  GlobeIcon,
  ImageIcon,
  LinkIcon,
  MailIcon,
  MessageCircleIcon,
  PrinterIcon,
  Share2Icon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import type { NoteDTO } from "@/lib/note-types";
import {
  buildNoteMailtoUrl,
  buildSocialShareLinks,
  copyTextToClipboard,
  formatNotePlainText,
  openExternalShare,
  printNote,
  shareNote,
  type NoteExportOptions,
} from "@/lib/note-export";
import {
  downloadNoteAsJpeg,
  shareNoteAsJpeg,
  shareNoteWithNativeSheet,
} from "@/lib/note-share-image";
import { cn } from "@/lib/utils";

type ShareFeedback = "idle" | "copied" | "shared" | "saved" | "printed";

export function NoteShareMenu({
  note,
  exportOptions,
  onError,
  triggerClassName,
}: {
  note: NoteDTO;
  exportOptions: NoteExportOptions;
  onError: (message: string | null) => void;
  triggerClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<ShareFeedback>("idle");

  function showFeedback(next: ShareFeedback) {
    setFeedback(next);
    window.setTimeout(() => setFeedback("idle"), 2000);
  }

  async function runAction(action: () => Promise<void> | void) {
    setBusy(true);
    onError(null);
    try {
      await action();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Could not complete share");
    } finally {
      setBusy(false);
    }
  }

  async function handleNativeShare() {
    const result = await shareNoteWithNativeSheet(note, exportOptions);
    if (result === "shared") {
      showFeedback("shared");
      setOpen(false);
      return;
    }
    if (result === "failed") {
      const fallback = await shareNote(note, exportOptions);
      if (fallback === "shared") {
        showFeedback("shared");
      } else if (fallback === "copied") {
        showFeedback("copied");
      } else if (fallback === "failed") {
        throw new Error("Could not share this note");
      }
    }
  }

  async function handleCopyText() {
    await copyTextToClipboard(formatNotePlainText(note, exportOptions));
    showFeedback("copied");
  }

  async function handleShareJpeg() {
    const result = await shareNoteAsJpeg(note, exportOptions);
    if (result === "shared") {
      showFeedback("shared");
      setOpen(false);
      return;
    }
    if (result === "downloaded") {
      showFeedback("saved");
      setOpen(false);
      return;
    }
    if (result === "failed") {
      throw new Error("Could not share note image");
    }
  }

  async function handleDownloadJpeg() {
    await downloadNoteAsJpeg(note, exportOptions);
    showFeedback("saved");
    setOpen(false);
  }

  async function handleLinkedIn() {
    await copyTextToClipboard(formatNotePlainText(note, exportOptions));
    openExternalShare(buildSocialShareLinks(note, exportOptions).linkedIn);
    showFeedback("copied");
  }

  function handlePrint() {
    printNote(note, exportOptions);
    showFeedback("printed");
    setOpen(false);
  }

  const canNativeShare =
    typeof navigator !== "undefined" && typeof navigator.share === "function";

  const triggerLabel =
    feedback === "copied"
      ? "Copied!"
      : feedback === "shared"
        ? "Shared!"
        : feedback === "saved"
          ? "Saved!"
          : feedback === "printed"
            ? "Printing…"
            : "Share";

  return (
    <div className="min-w-0 w-full">
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn("gap-1.5", triggerClassName)}
            disabled={busy}
          />
        }
      >
        {feedback === "copied" || feedback === "shared" || feedback === "saved" ? (
          <CheckIcon aria-hidden className="size-3.5" />
        ) : (
          <Share2Icon aria-hidden className="size-3.5" />
        )}
        {triggerLabel}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-52 p-1">
        {canNativeShare ? (
          <>
            <ShareMenuButton
              disabled={busy}
              icon={Share2Icon}
              label="Share…"
              onClick={() => void runAction(handleNativeShare)}
            />
            <Separator className="my-1" />
          </>
        ) : null}
        <ShareMenuButton
          disabled={busy}
          icon={MailIcon}
          label="Email"
          onClick={() => {
            window.location.href = buildNoteMailtoUrl(note, exportOptions);
            setOpen(false);
          }}
        />
        <ShareMenuButton
          disabled={busy}
          icon={MessageCircleIcon}
          label="WhatsApp"
          onClick={() => {
            openExternalShare(
              buildSocialShareLinks(note, exportOptions).whatsapp
            );
            setOpen(false);
          }}
        />
        <ShareMenuButton
          disabled={busy}
          icon={AtSignIcon}
          label="Post on X"
          onClick={() => {
            openExternalShare(buildSocialShareLinks(note, exportOptions).twitter);
            setOpen(false);
          }}
        />
        <ShareMenuButton
          disabled={busy}
          icon={GlobeIcon}
          label="Facebook"
          onClick={() => {
            openExternalShare(
              buildSocialShareLinks(note, exportOptions).facebook
            );
            setOpen(false);
          }}
        />
        <ShareMenuButton
          disabled={busy}
          icon={LinkIcon}
          label="LinkedIn"
          onClick={() => void runAction(handleLinkedIn)}
        />
        <Separator className="my-1" />
        <ShareMenuButton
          disabled={busy}
          icon={CopyIcon}
          label="Copy text"
          onClick={() => void runAction(handleCopyText)}
        />
        <ShareMenuButton
          disabled={busy}
          icon={ImageIcon}
          label="Share as JPG"
          onClick={() => void runAction(handleShareJpeg)}
        />
        <ShareMenuButton
          disabled={busy}
          icon={ImageIcon}
          label="Download JPG"
          onClick={() => void runAction(handleDownloadJpeg)}
        />
        <ShareMenuButton
          disabled={busy}
          icon={PrinterIcon}
          label="Print"
          onClick={() => runAction(handlePrint)}
        />
      </PopoverContent>
    </Popover>
    </div>
  );
}

function ShareMenuButton({
  icon: Icon,
  label,
  onClick,
  disabled,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="w-full justify-start gap-2"
      disabled={disabled}
      onClick={onClick}
    >
      <Icon aria-hidden className="size-3.5 shrink-0" />
      {label}
    </Button>
  );
}
