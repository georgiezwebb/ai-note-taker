import type { NoteDTO } from "@/lib/note-types";

function formatStamp(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function sanitizeNoteFilename(title: string): string {
  const base = title.trim() || "note";
  const cleaned = base
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 80)
    .replace(/^-+|-+$/g, "");
  return cleaned || "note";
}

export type NoteExportOptions = {
  summary?: string | null;
};

export function formatNotePlainText(
  note: NoteDTO,
  options?: NoteExportOptions
): string {
  const lines = [
    note.title,
    "",
    `Created: ${formatStamp(note.createdAt)}`,
  ];

  if (note.updatedAt !== note.createdAt) {
    lines.push(`Updated: ${formatStamp(note.updatedAt)}`);
  }

  lines.push("", note.content.trim() || "(No content)");

  const summary = options?.summary?.trim();
  if (summary) {
    lines.push("", "---", "AI Summary", "", summary);
  }

  return lines.join("\n");
}

export function formatNoteMarkdown(
  note: NoteDTO,
  options?: NoteExportOptions
): string {
  const lines = [
    `# ${note.title}`,
    "",
    `**Created:** ${formatStamp(note.createdAt)}`,
  ];

  if (note.updatedAt !== note.createdAt) {
    lines.push(`**Updated:** ${formatStamp(note.updatedAt)}`);
  }

  lines.push("", note.content.trim() || "_No content._");

  const summary = options?.summary?.trim();
  if (summary) {
    lines.push("", "## AI Summary", "", summary);
  }

  return lines.join("\n");
}

export function downloadNoteFile(
  content: string,
  filename: string,
  mimeType: string
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export async function copyTextToClipboard(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();
  if (!copied) {
    throw new Error("Could not copy to clipboard");
  }
}

export type ShareNoteResult = "shared" | "copied" | "cancelled" | "failed";

export async function shareNote(
  note: NoteDTO,
  options?: NoteExportOptions
): Promise<ShareNoteResult> {
  const text = formatNotePlainText(note, options);

  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share({
        title: note.title,
        text,
      });
      return "shared";
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return "cancelled";
      }
    }
  }

  try {
    await copyTextToClipboard(text);
    return "copied";
  } catch {
    return "failed";
  }
}

export function exportNoteAsText(
  note: NoteDTO,
  options?: NoteExportOptions
): void {
  const filename = `${sanitizeNoteFilename(note.title)}.txt`;
  downloadNoteFile(
    formatNotePlainText(note, options),
    filename,
    "text/plain;charset=utf-8"
  );
}

export function exportNoteAsMarkdown(
  note: NoteDTO,
  options?: NoteExportOptions
): void {
  const filename = `${sanitizeNoteFilename(note.title)}.md`;
  downloadNoteFile(
    formatNoteMarkdown(note, options),
    filename,
    "text/markdown;charset=utf-8"
  );
}

export function getNoteShareText(
  note: NoteDTO,
  options?: NoteExportOptions,
  maxLength?: number
): string {
  const full = formatNotePlainText(note, options);
  if (!maxLength || full.length <= maxLength) {
    return full;
  }
  return `${full.slice(0, maxLength - 1).trim()}…`;
}

export function buildNoteMailtoUrl(
  note: NoteDTO,
  options?: NoteExportOptions
): string {
  const subject = encodeURIComponent(note.title.trim() || "Note");
  const bodyText = getNoteShareText(note, options, 1800);
  const body = encodeURIComponent(bodyText);
  return `mailto:?subject=${subject}&body=${body}`;
}

export type SocialShareLinks = {
  whatsapp: string;
  twitter: string;
  facebook: string;
  linkedIn: string;
};

export function buildSocialShareLinks(
  note: NoteDTO,
  options?: NoteExportOptions
): SocialShareLinks {
  const fullText = getNoteShareText(note, options);
  const tweetText = getNoteShareText(note, options, 240);
  const encodedFull = encodeURIComponent(fullText);
  const encodedTweet = encodeURIComponent(tweetText);

  return {
    whatsapp: `https://api.whatsapp.com/send?text=${encodedFull}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodedTweet}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?quote=${encodedFull}&display=popup`,
    linkedIn: "https://www.linkedin.com/feed/",
  };
}

export function openExternalShare(url: string): void {
  window.open(url, "_blank", "noopener,noreferrer,width=640,height=720");
}

export function buildNotePrintHtml(
  note: NoteDTO,
  options?: NoteExportOptions
): string {
  const title = escapeHtml(note.title.trim() || "Untitled note");
  const created = escapeHtml(formatStamp(note.createdAt));
  const updated =
    note.updatedAt !== note.createdAt
      ? escapeHtml(formatStamp(note.updatedAt))
      : null;
  const body = escapeHtml(note.content.trim() || "No content yet.").replace(
    /\n/g,
    "<br />"
  );
  const summary = options?.summary?.trim();
  const summaryHtml = summary
    ? `<section class="summary"><h2>AI Summary</h2><p>${escapeHtml(summary).replace(/\n/g, "<br />")}</p></section>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 2rem;
      font-family: system-ui, -apple-system, sans-serif;
      color: #1e1b4b;
      line-height: 1.6;
    }
    .bar {
      height: 4px;
      margin: -2rem -2rem 1.5rem;
      background: linear-gradient(90deg, #7c3aed, #a855f7, #38bdf8);
    }
    h1 {
      margin: 0 0 0.5rem;
      font-size: 1.75rem;
      line-height: 1.25;
    }
    .meta {
      margin: 0 0 1.5rem;
      color: #64748b;
      font-size: 0.875rem;
    }
    .content {
      white-space: pre-wrap;
      font-size: 1rem;
    }
    .summary {
      margin-top: 2rem;
      padding: 1rem 1.25rem;
      border: 1px solid #ddd6fe;
      border-radius: 0.75rem;
      background: #f5f3ff;
    }
    .summary h2 {
      margin: 0 0 0.75rem;
      font-size: 0.75rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #6d28d9;
    }
    .summary p { margin: 0; }
    @media print {
      body { padding: 0; }
      .bar { margin: 0 0 1.5rem; }
    }
  </style>
</head>
<body>
  <div class="bar"></div>
  <h1>${title}</h1>
  <p class="meta">Created ${created}${updated ? ` · Updated ${updated}` : ""}</p>
  <div class="content">${body}</div>
  ${summaryHtml}
</body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function printNote(note: NoteDTO, options?: NoteExportOptions): void {
  const html = buildNotePrintHtml(note, options);
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.style.position = "fixed";
  frame.style.right = "0";
  frame.style.bottom = "0";
  frame.style.width = "0";
  frame.style.height = "0";
  frame.style.border = "0";
  document.body.appendChild(frame);

  const doc = frame.contentDocument ?? frame.contentWindow?.document;
  if (!doc) {
    frame.remove();
    throw new Error("Could not open print view");
  }

  doc.open();
  doc.write(html);
  doc.close();

  frame.contentWindow?.focus();
  frame.contentWindow?.print();

  window.setTimeout(() => {
    frame.remove();
  }, 1000);
}

export async function exportNoteAsJpeg(
  note: NoteDTO,
  options?: NoteExportOptions
): Promise<void> {
  const { downloadNoteAsJpeg } = await import("@/lib/note-share-image");
  await downloadNoteAsJpeg(note, options);
}
