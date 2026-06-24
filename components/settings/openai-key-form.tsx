"use client";

import { useEffect, useState } from "react";
import { ExternalLinkIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { OpenAiKeyEntryDTO, OpenAiKeyStatusDTO } from "@/lib/openai-key-types";

function KeyRow({
  entry,
  busy,
  onRemove,
  onRename,
}: {
  entry: OpenAiKeyEntryDTO;
  busy: boolean;
  onRemove: (id: string) => void;
  onRename: (id: string, name: string) => void;
}) {
  const [name, setName] = useState(entry.name);

  useEffect(() => {
    setName(entry.name);
  }, [entry.name]);

  function commitName() {
    const trimmed = name.trim();
    if (!trimmed || trimmed === entry.name) {
      setName(entry.name);
      return;
    }
    onRename(entry.id, trimmed);
  }

  return (
    <li className="flex flex-col gap-2 rounded-lg border border-border/60 bg-muted/20 p-2.5">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1 grid gap-1">
          <Label className="sr-only" htmlFor={`key-name-${entry.id}`}>
            Key name
          </Label>
          <Input
            id={`key-name-${entry.id}`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={commitName}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commitName();
              }
            }}
            disabled={busy}
            className="h-8 text-xs font-medium"
          />
          <p className="truncate font-mono text-[11px] text-muted-foreground">
            {entry.keyHint}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="xs"
          className="h-8 shrink-0 px-2 text-xs text-destructive hover:text-destructive"
          disabled={busy}
          onClick={() => onRemove(entry.id)}
        >
          Remove
        </Button>
      </div>
    </li>
  );
}

export function OpenAiKeyForm({
  status,
  onStatusChange,
  onSaved,
  idPrefix = "openai-key",
  submitLabel = "Add key",
}: {
  status: OpenAiKeyStatusDTO | null;
  onStatusChange: (status: OpenAiKeyStatusDTO) => void;
  onSaved?: () => void;
  idPrefix?: string;
  submitLabel?: string;
}) {
  const [keyName, setKeyName] = useState(status?.suggestedKeyName ?? "Key 1");
  const [apiKey, setApiKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (status?.suggestedKeyName) {
      setKeyName(status.suggestedKeyName);
    }
  }, [status?.suggestedKeyName]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    const trimmedKey = apiKey.trim();
    const trimmedName = keyName.trim();
    if (!trimmedName) {
      setError("Give this key a name.");
      return;
    }
    if (!trimmedKey) {
      setError("Paste your OpenAI API key.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/settings/openai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: trimmedKey, name: trimmedName }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        status?: OpenAiKeyStatusDTO;
      };
      if (!res.ok) {
        throw new Error(data.error ?? "Could not save API key");
      }
      if (data.status) {
        onStatusChange(data.status);
        setKeyName(data.status.suggestedKeyName);
      }
      setApiKey("");
      setMessage(`${trimmedName} saved and verified.`);
      onSaved?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save API key");
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove(keyId: string) {
    setError(null);
    setMessage(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/settings/openai/${keyId}`, {
        method: "DELETE",
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        status?: OpenAiKeyStatusDTO;
      };
      if (!res.ok) {
        throw new Error(data.error ?? "Could not remove API key");
      }
      if (data.status) {
        onStatusChange(data.status);
        setKeyName(data.status.suggestedKeyName);
      }
      setMessage("API key removed.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove API key");
    } finally {
      setBusy(false);
    }
  }

  async function handleRename(keyId: string, name: string) {
    setError(null);
    setMessage(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/settings/openai/${keyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        status?: OpenAiKeyStatusDTO;
      };
      if (!res.ok) {
        throw new Error(data.error ?? "Could not rename key");
      }
      if (data.status) {
        onStatusChange(data.status);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not rename key");
    } finally {
      setBusy(false);
    }
  }

  const keys = status?.keys ?? [];

  return (
    <div className="grid gap-3">
      {keys.length > 0 ? (
        <ul className="grid gap-2">
          {keys.map((entry) => (
            <KeyRow
              key={entry.id}
              entry={entry}
              busy={busy}
              onRemove={handleRemove}
              onRename={handleRename}
            />
          ))}
        </ul>
      ) : (
        <p className="text-xs text-muted-foreground">
          Your keys are encrypted and stored for your account only. We never show
          the full key after saving.
        </p>
      )}

      <form onSubmit={handleSave} className="grid gap-3 border-t border-border/50 pt-3">
        <p className="text-xs font-medium text-foreground">
          {keys.length > 0 ? "Add another key" : "Add a key"}
        </p>
        <div className="grid gap-2">
          <Label htmlFor={`${idPrefix}-name`}>Name</Label>
          <Input
            id={`${idPrefix}-name`}
            value={keyName}
            onChange={(e) => setKeyName(e.target.value)}
            placeholder="Key 1"
            autoComplete="off"
            disabled={busy}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={`${idPrefix}-input`}>OpenAI API key</Label>
          <Input
            id={`${idPrefix}-input`}
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-…"
            autoComplete="off"
            disabled={busy}
            spellCheck={false}
          />
        </div>
        <a
          href="https://platform.openai.com/api-keys"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          Get a key from OpenAI
          <ExternalLinkIcon aria-hidden className="size-3" />
        </a>
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        {message ? (
          <p className="text-sm text-muted-foreground" role="status">
            {message}
          </p>
        ) : null}
        <Button type="submit" size="sm" disabled={busy}>
          {busy ? "Checking…" : submitLabel}
        </Button>
      </form>
    </div>
  );
}
