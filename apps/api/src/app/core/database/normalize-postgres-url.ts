function stripOuterQuotes(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length < 2) return trimmed;

  const first = trimmed[0];
  const last = trimmed[trimmed.length - 1];
  if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
    return trimmed.slice(1, -1).trim();
  }

  return trimmed;
}

/**
 * Some `.env` values (especially Supabase) can include passwords with reserved URL characters
 * (e.g. `#` or `/`). Node's `URL` parser (used by `pg-connection-string`) requires these to be
 * percent-encoded in the userinfo portion.
 *
 * This helper makes local dev more forgiving by encoding username/password only when the URL
 * is not parseable as-is.
 */
export function normalizePostgresUrl(
  databaseUrl: string | undefined,
): string | undefined {
  if (!databaseUrl) return databaseUrl;

  const raw = stripOuterQuotes(databaseUrl);

  try {
    // If it's already a valid URL (most production setups), keep it unchanged.
    // eslint-disable-next-line no-new
    new URL(raw);
    return raw;
  } catch {
    // continue
  }

  const schemeMatch = raw.match(/^([a-zA-Z][a-zA-Z0-9+.-]*):\/\/(.+)$/);
  if (!schemeMatch) return raw;

  const scheme = schemeMatch[1];
  const remainder = schemeMatch[2];
  const atIndex = remainder.lastIndexOf('@');
  if (atIndex === -1) return raw;

  const userInfo = remainder.slice(0, atIndex);
  const hostAndPath = remainder.slice(atIndex + 1);

  const colonIndex = userInfo.indexOf(':');
  const username = colonIndex === -1 ? userInfo : userInfo.slice(0, colonIndex);
  const password = colonIndex === -1 ? undefined : userInfo.slice(colonIndex + 1);

  const encodedUser = encodeURIComponent(username);
  const encodedPass = password !== undefined ? encodeURIComponent(password) : undefined;

  const rebuilt =
    encodedPass !== undefined
      ? `${scheme}://${encodedUser}:${encodedPass}@${hostAndPath}`
      : `${scheme}://${encodedUser}@${hostAndPath}`;

  try {
    // eslint-disable-next-line no-new
    new URL(rebuilt);
    return rebuilt;
  } catch {
    return raw;
  }
}

