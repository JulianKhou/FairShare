const DEFAULT_ALLOWED_ORIGINS = ["https://simpleshare.eu", "http://localhost:5173"];

const configuredOrigins = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const allowedOrigins =
  configuredOrigins.length > 0 ? configuredOrigins : DEFAULT_ALLOWED_ORIGINS;

const baseCorsHeaders = {
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export const isOriginAllowed = (origin: string | null) => {
  // Requests ohne Origin (z. B. server-to-server/curl) nicht blockieren.
  if (!origin) return true;
  return allowedOrigins.includes(origin);
};

export const getCorsHeaders = (req: Request) => {
  const origin = req.headers.get("origin");
  const allowOrigin =
    origin && isOriginAllowed(origin) ? origin : allowedOrigins[0];

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
