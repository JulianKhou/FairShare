const DEFAULT_ALLOWED_ORIGINS = [
  "https://simpleshare.eu",
  "http://localhost:5173",
];

const configuredOrigins = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const normalizeOrigin = (origin: string) => {
  try {
    const url = new URL(origin);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return `${url.protocol}//${url.host}`.toLowerCase();
  } catch {
    return null;
  }
};

const isIpv4 = (host: string) => /^\d{1,3}(\.\d{1,3}){3}$/.test(host);

const buildAllowedOrigins = (origins: string[]) => {
  const expanded = new Set<string>();

  for (const raw of origins) {
    const normalized = normalizeOrigin(raw);
    if (!normalized) continue;

    expanded.add(normalized);

    // Convenience: if root domain is configured, allow www variant as well (and vice versa).
    const url = new URL(normalized);
    const host = url.hostname.toLowerCase();
    const hasRealDomain =
      host.includes(".") && host !== "localhost" && !isIpv4(host);
    if (!hasRealDomain) continue;

    const counterpartHost = host.startsWith("www.")
      ? host.slice(4)
      : `www.${host}`;
    const counterpart = `${url.protocol}//${counterpartHost}${url.port ? `:${url.port}` : ""}`.toLowerCase();
    expanded.add(counterpart);
  }

  return [...expanded];
};

const configuredOrDefault =
  configuredOrigins.length > 0 ? configuredOrigins : DEFAULT_ALLOWED_ORIGINS;
const allowedOrigins = buildAllowedOrigins(configuredOrDefault);
const allowedOriginsSet = new Set(allowedOrigins);

const baseCorsHeaders = {
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export const isOriginAllowed = (origin: string | null) => {
  // Requests without Origin (e.g. server-to-server/curl) should not be blocked.
  if (!origin) return true;
  const normalized = normalizeOrigin(origin);
  return normalized ? allowedOriginsSet.has(normalized) : false;
};

export const getCorsHeaders = (req: Request) => {
  const origin = req.headers.get("origin");
  const normalizedOrigin = origin ? normalizeOrigin(origin) : null;

  const allowOrigin =
    normalizedOrigin && allowedOriginsSet.has(normalizedOrigin)
      ? normalizedOrigin
      : allowedOrigins[0];

  return {
    ...baseCorsHeaders,
    "Access-Control-Allow-Origin": allowOrigin,
    Vary: "Origin",
  };
};

// Backward-compat export
export const corsHeaders = {
  ...baseCorsHeaders,
  "Access-Control-Allow-Origin": allowedOrigins[0],
  Vary: "Origin",
};
