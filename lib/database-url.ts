/**
 * pg v8 / pg-connection-string v2 treat require/prefer/verify-ca like verify-full.
 * Setting sslmode=verify-full explicitly avoids the Node stderr warning and matches
 * that behavior. See: pg-connection-string v3 / pg v9 migration notes.
 */
export function explicitSslDatabaseUrl(raw: string | undefined): string | undefined {
  if (!raw) {
    return raw;
  }
  try {
    const url = new URL(raw);
    const mode = url.searchParams.get("sslmode");
    if (
      mode === "require" ||
      mode === "prefer" ||
      mode === "verify-ca"
    ) {
      url.searchParams.set("sslmode", "verify-full");
    }
    return url.href;
  } catch {
    return raw;
  }
}
