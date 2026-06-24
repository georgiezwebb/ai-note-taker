import type { NoteDTO } from "@/lib/note-types";
import type { NoteExportOptions } from "@/lib/note-export";
import { formatNotePlainText, sanitizeNoteFilename } from "@/lib/note-export";

const IMAGE_WIDTH = 840;
const PADDING = 48;
const CONTENT_WIDTH = IMAGE_WIDTH - PADDING * 2;

function formatStamp(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const lines: string[] = [];

  for (const paragraph of text.split("\n")) {
    if (!paragraph.trim()) {
      lines.push("");
      continue;
    }

    const words = paragraph.split(/\s+/);
    let current = "";

    for (const word of words) {
      const test = current ? `${current} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && current) {
        lines.push(current);
        current = word;
      } else {
        current = test;
      }
    }

    if (current) {
      lines.push(current);
    }
  }

  return lines.length > 0 ? lines : [""];
}

type LayoutBlock = {
  kind: "title" | "meta" | "body" | "summary-label" | "summary-body";
  lines: string[];
};

function buildLayoutBlocks(
  note: NoteDTO,
  options?: NoteExportOptions
): LayoutBlock[] {
  const blocks: LayoutBlock[] = [
    { kind: "title", lines: [note.title.trim() || "Untitled note"] },
    {
      kind: "meta",
      lines: [
        `Created ${formatStamp(note.createdAt)}${
          note.updatedAt !== note.createdAt
            ? ` · Updated ${formatStamp(note.updatedAt)}`
            : ""
        }`,
      ],
    },
    {
      kind: "body",
      lines: (note.content.trim() || "No content yet.").split("\n"),
    },
  ];

  const summary = options?.summary?.trim();
  if (summary) {
    blocks.push({ kind: "summary-label", lines: ["AI Summary"] });
    blocks.push({ kind: "summary-body", lines: summary.split("\n") });
  }

  return blocks;
}

function measureNoteImageHeight(
  ctx: CanvasRenderingContext2D,
  blocks: LayoutBlock[]
): number {
  let height = PADDING + 6;

  for (const block of blocks) {
    switch (block.kind) {
      case "title":
        ctx.font = "600 28px system-ui, -apple-system, sans-serif";
        height += wrapLines(ctx, block.lines[0]!, CONTENT_WIDTH).length * 34 + 12;
        break;
      case "meta":
        ctx.font = "400 14px system-ui, -apple-system, sans-serif";
        height += 22;
        break;
      case "body":
        ctx.font = "400 16px system-ui, -apple-system, sans-serif";
        for (const line of block.lines) {
          height +=
            (line.trim()
              ? wrapLines(ctx, line, CONTENT_WIDTH).length
              : 1) * 24 + 2;
        }
        height += 8;
        break;
      case "summary-label":
        height += 28;
        break;
      case "summary-body":
        ctx.font = "400 15px system-ui, -apple-system, sans-serif";
        for (const line of block.lines) {
          height +=
            (line.trim()
              ? wrapLines(ctx, line, CONTENT_WIDTH - 24).length
              : 1) * 22 + 2;
        }
        height += 8;
        break;
    }
  }

  return height + PADDING;
}

function drawNoteOnCanvas(
  canvas: HTMLCanvasElement,
  note: NoteDTO,
  options?: NoteExportOptions
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not render note image");
  }

  const blocks = buildLayoutBlocks(note, options);
  canvas.width = IMAGE_WIDTH;
  canvas.height = measureNoteImageHeight(ctx, blocks);

  ctx.fillStyle = "#faf8ff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
  gradient.addColorStop(0, "#7c3aed");
  gradient.addColorStop(0.5, "#a855f7");
  gradient.addColorStop(1, "#38bdf8");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, 6);

  let y = PADDING + 6;

  for (const block of blocks) {
    switch (block.kind) {
      case "title": {
        ctx.fillStyle = "#1e1b4b";
        ctx.font = "600 28px system-ui, -apple-system, sans-serif";
        for (const line of wrapLines(ctx, block.lines[0]!, CONTENT_WIDTH)) {
          ctx.fillText(line, PADDING, y + 24);
          y += 34;
        }
        y += 12;
        break;
      }
      case "meta": {
        ctx.fillStyle = "#64748b";
        ctx.font = "400 14px system-ui, -apple-system, sans-serif";
        ctx.fillText(block.lines[0]!, PADDING, y + 14);
        y += 22;
        break;
      }
      case "body": {
        ctx.fillStyle = "#334155";
        ctx.font = "400 16px system-ui, -apple-system, sans-serif";
        for (const paragraph of block.lines) {
          const lines = paragraph.trim()
            ? wrapLines(ctx, paragraph, CONTENT_WIDTH)
            : [""];
          for (const line of lines) {
            ctx.fillText(line, PADDING, y + 16);
            y += 24;
          }
          y += 2;
        }
        y += 8;
        break;
      }
      case "summary-label": {
        y += 8;
        ctx.fillStyle = "#6d28d9";
        ctx.font = "600 12px system-ui, -apple-system, sans-serif";
        ctx.fillText("AI SUMMARY", PADDING, y + 12);
        y += 28;
        break;
      }
      case "summary-body": {
        const boxTop = y;
        ctx.font = "400 15px system-ui, -apple-system, sans-serif";
        const wrapped: string[] = [];
        for (const paragraph of block.lines) {
          wrapped.push(
            ...(paragraph.trim()
              ? wrapLines(ctx, paragraph, CONTENT_WIDTH - 24)
              : [""])
          );
        }
        const boxHeight = wrapped.length * 22 + 24;
        ctx.fillStyle = "#f3e8ff";
        ctx.fillRect(PADDING, boxTop, CONTENT_WIDTH, boxHeight);
        ctx.fillStyle = "#312e81";
        y = boxTop + 20;
        for (const line of wrapped) {
          ctx.fillText(line, PADDING + 12, y);
          y += 22;
        }
        y += 16;
        break;
      }
    }
  }
}

export async function renderNoteToJpegBlob(
  note: NoteDTO,
  options?: NoteExportOptions
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  drawNoteOnCanvas(canvas, note, options);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Could not create JPEG"));
        }
      },
      "image/jpeg",
      0.92
    );
  });
}

export function downloadBlob(blob: Blob, filename: string): void {
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

export async function downloadNoteAsJpeg(
  note: NoteDTO,
  options?: NoteExportOptions
): Promise<void> {
  const blob = await renderNoteToJpegBlob(note, options);
  downloadBlob(blob, `${sanitizeNoteFilename(note.title)}.jpg`);
}

export async function shareNoteAsJpeg(
  note: NoteDTO,
  options?: NoteExportOptions
): Promise<"shared" | "downloaded" | "cancelled" | "failed"> {
  const blob = await renderNoteToJpegBlob(note, options);
  const filename = `${sanitizeNoteFilename(note.title)}.jpg`;
  const file = new File([blob], filename, { type: "image/jpeg" });

  if (
    typeof navigator !== "undefined" &&
    typeof navigator.share === "function" &&
    typeof navigator.canShare === "function" &&
    navigator.canShare({ files: [file] })
  ) {
    try {
      await navigator.share({
        title: note.title,
        text: note.title,
        files: [file],
      });
      return "shared";
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return "cancelled";
      }
    }
  }

  try {
    downloadBlob(blob, filename);
    return "downloaded";
  } catch {
    return "failed";
  }
}

export async function shareNoteWithNativeSheet(
  note: NoteDTO,
  options?: NoteExportOptions
): Promise<"shared" | "cancelled" | "failed"> {
  const text = formatNotePlainText(note, options);

  if (typeof navigator === "undefined" || typeof navigator.share !== "function") {
    return "failed";
  }

  try {
    const blob = await renderNoteToJpegBlob(note, options);
    const file = new File(
      [blob],
      `${sanitizeNoteFilename(note.title)}.jpg`,
      { type: "image/jpeg" }
    );

    if (
      typeof navigator.canShare === "function" &&
      navigator.canShare({ files: [file] })
    ) {
      await navigator.share({
        title: note.title,
        text,
        files: [file],
      });
    } else {
      await navigator.share({ title: note.title, text });
    }

    return "shared";
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      return "cancelled";
    }
    return "failed";
  }
}
